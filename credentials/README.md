# Credentials
The credentials for the VM are as follows:

Key         | Value
------------|-------------------------------------
Host        | `gdsd.norwayeast.cloudapp.azure.com`
Username    | `gdsd`

The private SSH key can be found in this folder.

## Login
To login, use the following command:
```sh
chmod 500 gdsd_key.pem
ssh -i gdsd_key.pem gdsd@gdsd.norwayeast.cloudapp.azure.com
```
