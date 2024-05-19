FROM rust:1.78.0-alpine3.19 AS lib-builder
WORKDIR /root
COPY lib/ ./
RUN apk add --no-cache musl-dev
RUN cargo build --release

FROM golang:1.22.2-alpine3.19 as server-builder
WORKDIR /root
COPY . .
COPY --from=lib-builder /root/target/release/libyacht.a ./lib/
RUN apk add --no-cache musl-dev gcc
ENV CGO_ENABLED=1
RUN go build -o yachty-yachta .

FROM alpine:3.19
WORKDIR /root/
COPY --from=server-builder /root/yachty-yachta .
RUN apk add --no-cache gcc
EXPOSE 4434

CMD ["./yachty-yachta"]
