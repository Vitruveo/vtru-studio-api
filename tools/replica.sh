#!/bin/bash

echo "development" >/data/replica.key
chmod 400 /data/replica.key
chown 999:999 /data/replica.key

echo PARAMS:
echo $@

/usr/local/bin/docker-entrypoint.sh $@