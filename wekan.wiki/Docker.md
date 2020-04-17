## Using only Docker commands

[![Docker Repository on Quay](https://quay.io/repository/wekan/wekan/status "Docker Repository on Quay")](https://quay.io/repository/wekan/wekan)

[Many tags available](https://quay.io/repository/wekan/wekan?tab=tags)

## Note: docker-compose.yml works

There is much more settings at well-documented [docker-compose.yml](https://raw.githubusercontent.com/wekan/wekan/master/docker-compose.yml), those can also be added to be used below.

If you don't need to build Wekan, use prebuilt container with docker-compose.yml from https://github.com/wekan/wekan like this:
```
docker-compose up -d
```

If you like to build from source, clone Wekan repo:
```
git clone https://github.com/wekan/wekan
```
Then edit docker-compose.yml with [these lines uncommented](https://github.com/wekan/wekan/blob/master/docker-compose.yml#L132-L142) this way:
```
   #-------------------------------------------------------------------------------------
    # ==== BUILD wekan-app DOCKER CONTAINER FROM SOURCE, if you uncomment these ====
    # ==== and use commands: docker-compose up -d --build
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_VERSION=${NODE_VERSION}
        - METEOR_RELEASE=${METEOR_RELEASE}
        - NPM_VERSION=${NPM_VERSION}
        - ARCHITECTURE=${ARCHITECTURE}
        - SRC_PATH=${SRC_PATH}
        - METEOR_EDGE=${METEOR_EDGE}
        - USE_EDGE=${USE_EDGE}
    #-------------------------------------------------------------------------------------
```
Then you can build Wekan with 
```
docker-compose up -d --build
```

## Note: Currently these Docker command examples do not work, help welcome

Example for latest Wekan, port 2000 to Docker Wekan internal port 8080:
```
docker run -d --restart=always --name wekan-db mongo:4.0

docker run -d --restart=always --name wekan --link "wekan-db:db" -e "WITH_API=true" -e "MONGO_URL=mongodb://db" -e "ROOT_URL=http://192.168.1.200:2000" -p 2000:8080 quay.io/wekan/wekan
```
Specific release in above URL, not latest:
```
quay.io/wekan/wekan:v3.37
```
For latest development version, use without tag:
```
quay.io/wekan/wekan
```

## DockerBunker: Easy Docker management

[Managing Docker containers with DockerBunker](https://github.com/chaosbunker/dockerbunker)

## CaptainDuckDuck

[Managing Docker containers with CaptainDuckDuck](https://github.com/wekan/wekan/issues/1375#issuecomment-413626075)

## Backup and Upgrade

[Import/Export MongoDB data to/from Docker container](https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data)

[Move Docker containers to other computer](https://github.com/wekan/wekan/wiki/Move-Docker-containers-to-other-computer), needs more details

[Backup and Upgrade](https://github.com/wekan/wekan-mongodb#backup-before-upgrading)

Quay: `image: quay.io/wekan/wekan:v3.37`
Docker Hub: maybe is broken.

Based on Debian 10, Docker image at Quay.io Docker reqistry


[Wekan for Docker bug reports and feature requests](https://github.com/wekan/wekan-mongodb/issues)

## Cleanup

[Cleanup and delete all Docker data to get Docker Compose working](https://github.com/wekan/wekan/issues/985)

[Cleanup scripts to remove old data](https://github.com/wekan/wekan-cleanup)

## Docker Compose

[Docker Compose: Wekan <=> MongoDB](https://github.com/wekan/wekan-mongodb). REQUIRED: READ AND ADD SETTINGS LIKE ROOT_URL ETC TO docker-compose.yml textfile. It also has info about using same MongoDB database for office and VPN users.

[Docker Compose: Wekan <=> MongoDB <=> ToroDB => PostgreSQL read-only mirroring](https://github.com/wekan/wekan-postgresql)

TODO: [Docker Compose: Wekan <=> MongoDB <=> ToroDB => MySQL read-only mirroring](https://github.com/torodb/stampede/issues/203)

## OpenShift

[OpenShift](https://github.com/wekan/wekan/wiki/OpenShift)

## SLES

[SLES SP1](https://github.com/wekan/wekan/wiki/Install-Wekan-Docker-on-SUSE-Linux-Enterprise-Server-12-SP1)

## Rancher

[Rancher Rancher Active Proxy](https://github.com/wekan/wekan/wiki/Rancher---Rancher-Active-Proxy---Wekan-MongoDB-Docker)

## Testing

[Install for testing](https://github.com/wekan/wekan/wiki/Install-Wekan-Docker-for-testing)

## Production

[Production setup for thousands of users with Docker at AWS](https://github.com/wekan/wekan/wiki/AWS)

[Other way to do production](https://github.com/wekan/wekan/wiki/Install-Wekan-Docker-in-production)

## External MongoDB auth

[External MongoDB authentication](https://github.com/wekan/wekan/issues/1375)

## Admin Panel

First registered Wekan user will get Admin Panel on new Docker and source based
installs. You can also [enable Admin Panel manually](https://github.com/wekan/wekan/blob/master/CHANGELOG.md#v0111-rc2-2017-03-05-wekan-prerelease)

## Docker Hub - sometimes broken

Currently there are two dockerhub builds for wekan. One at [mquandalle dockerhub](https://hub.docker.com/r/mquandalle/wekan/builds/) and another at [wekanteam dockerhub](https://hub.docker.com/r/wekanteam/wekan/builds/). 

[wekanteam dockerhub](https://hub.docker.com/r/wekanteam/wekan/builds/) is usually broken.

## Development:

### `docker run` examples

- MongoDB:

```
docker run -d --restart=always --name wekan-db mongo:3.2.20
```

- No build step, pull from the [quay](https://quay.io/repository/wekan/wekan?tab=tags) and
specify docker variables

```
docker run -d --restart=always --name wekan --link "wekan-db:db" -e "MONGO_URL=mongodb://db" -e "ROOT_URL=http://localhost:8080" -p 8080:8080 quay.io/wekan/wekan
```


### `docker-compose` examples

- No build step and pull from [quay](https://quay.io/repository/wekan/wekan?tab=tags)

```
sudo docker-compose up -d --nobuild
```

- Build default
```
sudo docker-compose up -d --build
```

- Build with newer Node version:
```
echo 'NODE_VERSION=v8.11.1' >> .env && \
sudo docker-compose up -d --build
```

- Build custom image off a release candidate or beta for meteor
```
echo 'METEOR_EDGE=1.5-beta.17' >> .env && \
echo 'USE_EDGE=true' >> .env && \
sudo docker-compose up -d --build
```

## Docker env for Wekan dev

* [Docker environment for Wekan Development](https://github.com/wekan/wekan-dev)

## Alpine, needs testing

* [Docker Compose: Alpine Linux and Wekan <=> MongoDB](https://github.com/wekan/wekan-launchpad)

## Webserver Config

* [Caddy Webserver Config](https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config)
* [Nginx Webserver Config](https://github.com/wekan/wekan/wiki/Nginx-Webserver-Config)
* [Apache Webserver Config](https://github.com/wekan/wekan/wiki/Apache)