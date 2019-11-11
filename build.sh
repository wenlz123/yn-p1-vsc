#!/bin/bash

echo $1
mkdir out
cd out
mkdir metadata
cp -r ../src/metadata/** ./metadata/
cd ..

tsc $1 -p ./