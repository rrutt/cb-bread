FROM node:0.10.35-slim
MAINTAINER Rick Rutt <RRutt@live.com>

COPY . /

RUN \
  npm install
  
EXPOSE 8008

ENTRYPOINT ["node"]
CMD ["server"]

#CMD ["bash"]
