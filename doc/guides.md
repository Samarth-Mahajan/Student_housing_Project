# Guides

## Git setup
To setup git, we need to create a new SSH key.

- open a new PowerShell window.
- generate a new key and copy it with the following commands (replace your email)
    ```pwsh
    ssh-keygen -t ed25519 -C <email>
    cat ~/.ssh/id_ed25519.pub | clip
    ```

- visit the [keys settings](https://github.com/settings/keys) on GitHub and add a new SSH key.
- now you can push to repos using the SSH link they provide (should look similar to `git@github.com:user/repo.git`)

More info can be found here: [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## Server setup
We use Azure for this project.

### VM
- in Azure, search for *Virtual machines*
- create a new *Azure virtual machine*:

#### Basics
- create a new resource group
- give it a name
- for the image, choose the latest Ubuntu version (in our case *Ubuntu Server 24.04 LTS - x64 Gen2*)
- set up the administrator account with an SSH key (we will use that to log in later)
- for the inbound ports, select all available options (22, 80 & 443)

#### Disks
The defaults are okay.

#### Networking
- create a new virtual network & a public IP
- allow all inbound ports from earlier (22, 80 & 443)

#### Other
The rest of the settings can be left at their defaults.

### Open the DB port (only for this course)
- navigate to your newly created VM
- go to *Networking* -> *Network settings*
- create a new inbound port rule and change these fields:
  - Source: Any
  - Source port range: `*`
  - Destination: Any
  - Service: Custom
  - Destination port ranges: 33061
  - Protocol: TCP
  - Action: Allow

### Custom DNS
- navigate to your newly created VM
- under *Overview*, search for *Network interface* (it should have a name similar to your VM)
- click on it
- on the Network interface *Overview* page, search for the *Public IPv4 address*
- click on it
- on the *Public IP address* page, select *Settings* -> *Configuration* from the sidebar
- enter a desired DNS name label

The resulting DNS address can be used instead of the public IP now!

### Software
Execute the following on the VM:

```sh
DOMAIN=<domain>.cloudapp.azure.com
EMAIL=<email>
MYSQL_PORT=33061
MYSQL_PASSWORD=<mysql-password>
FRONTEND_PORT=3000
BACKEND_PORT=5000

# install nginx & mysql
sudo apt update && sudo apt upgrade -y
sudo apt install nginx mysql-server -y

# mysql config
sudo systemctl restart mysql
sudo sh -c "cat >> /etc/mysql/mysql.conf.d/mysqld.cnf" <<-EOT
port = ${MYSQL_PORT}
bind-address = 0.0.0.0
mysqlx-bind-address = 0.0.0.0
EOT
sudo mysql -e "CREATE USER 'gdsd'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON gdsd_production.* TO 'gdsd'@'%' WITH GRANT OPTION;"
sudo mysql -e "GRANT ALL PRIVILEGES ON gdsd_development.* TO 'gdsd'@'%' WITH GRANT OPTION;"

# add nginx config
sudo usermod -aG gdsd www-data
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
sudo sh -c "cat > /etc/nginx/sites-available/default" <<-EOT
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        root /home/gdsd/frontend;
        try_files \$uri \$uri/ /index.html;
    }

    location /socket.io {
        proxy_pass http://localhost:${BACKEND_PORT};

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api {
        return 302 \$scheme://\$host/api/;
    }

    location ^~ /api/ {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        rewrite /api(.*) \$1 break;
    }
}
EOT

# start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ssl
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${EMAIL}

# install node
# https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions-deb
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt-get install -y nodejs
rm nodesource_setup.sh

# create backend service
sudo sh -c "cat > /etc/systemd/system/backend.service" <<-EOT
[Unit]
Description=GDSD Backend service
After=mysqld.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=30s
User=gdsd
WorkingDirectory=/home/gdsd/backend
ExecStart=node .

[Install]
WantedBy=multi-user.target
EOT

# start & enable on boot
sudo systemctl start backend
sudo systemctl enable backend
```

## CI/CD setup
The GitHub action under `.github/workflows/deploy-backend.yml` allows us to use CI/CD.

The needed setup is the following:
- go to the repo settings
- under *Security* -> *Secrets and variables* -> *Actions*:
    - add 3 new secrets: `HOST`, `SSH_KEY`, `USERNAME`
    - the values can be retrieved from the `credentials` folder in this repo
    - add an additional secret `ENV` with the content of the `.env` file (base64 encoded)
        - the reason for base64 is encoding is that there are errors when printing newlines in GitHub actions

Now the action should be able to run.

## Debugging
The server uses the following directories for the backend and frontend:

Location                | Description
------------------------|------------
`/home/gdsd/backend`    | Built backend (running via `backend.service`)
`/home/gdsd/frontend`   | Built frontend (folder is served directly via `nginx`)

To view the logs of the backend, use the following command:
```sh
journalctl -xeu backend.service
```

Use `systemctl` to interact with the `backend.service`/`nginx` processes. This is useful for e.g. restarting the service after a small config change. Make sure to also change the guide accordingly so the deployment is reproducible.
