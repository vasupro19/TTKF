## Node Version v20.16.0

## Setting Up Virtual Host in Local 

```shell 
    For Mac Users 

    sudo nano /etc/hosts 

    # Add below the end of 
    #Virtual Hosts
    127.0.0.1 devcerebrum.holisol.test
```
## FOR Local development make sure to add env variables
```
VITE_APP_BASE_URL=<your value here>
VITE_APP_ENV=local  // for local development. Remove on prod
```