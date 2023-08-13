# A Web-Based Chat Application

## Quick Start
- Clone the repository
```console
$ git clone https://github.com/tk-tans/Web_based_chat_application.git
```
- Move into the repository
```console
$ cd Web_based_chat_application
```

### Backend
- Move into the `backend` folder.
    ```console
    $ cd backend
    ```
- Install required packages
    ```console
    $ yarn install
    ```
- Create a file `.env`, with the following contents:
    ```env
    PORT=5000
    CLIENT_URL=<enter the frontend dev server url>
    NODE_ENV="development" # would be subject to change
    
    # Database Settings
    DATABASE_URL="mysql://<url-encoded USERNAME>:<url-encoded PASSWORD>@<HOSTNAME>:<PORT>/<DATABASE>"

    TOKEN_SECRET="some-super-secret-string"
    ```
- Install MySQL server and MySQL Workbench
- Create a Database as per the URI set in `.env`
- Apply migrations to database by running the following command:
    ```console
    $ yarn run prisma migrate dev
    ```
- Run the application using:
    ```console
    $ yarn run dev
    ```

