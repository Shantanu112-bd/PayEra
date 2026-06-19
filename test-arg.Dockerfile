FROM alpine
ARG MY_VAR=hello
RUN env | grep MY_VAR
