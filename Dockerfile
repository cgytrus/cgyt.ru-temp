FROM alpine:latest

COPY . /website-src

WORKDIR /website-src

# no building required..... yet
CMD ["cp", "-rf", ".", "/srv/site/"]
