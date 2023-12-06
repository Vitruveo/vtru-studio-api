#!/bin/bash

function checkEnv() {
    envName=$1
    envValue=$2
    if [ "x$1" = "x" ] ; then
        export $envName=$envValue
    fi
}

if [ "x$@" = "xwait" ] ; then
    checkEnv MONGO_HOST mongo
    checkEnv MONGO_PORT 27017
    checkEnv REDIS_HOST redis
    checkEnv REDIS_PORT 6379
    checkEnv RABBITMQ_HOST rabbitmq
    checkEnv RABBITMQ_PORT 5672
    node tools/wait.js $MONGO_HOST $MONGO_PORT
    node tools/wait.js $REDIS_HOST $REDIS_PORT
    node tools/wait.js $RABBITMQ_HOST $RABBITMQ_PORT

    if [ "x$NODE_ENV" = "xproduction" ] ; then
        while true ; do
            date
            npm start
            sleep 300
        done
    else
        echo NODE_ENV já definido: $NODE_ENV
        npm run $NODE_ENV
    fi
else
    echo Executando comando: $@
    $@
fi
sleep 60
