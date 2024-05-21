FROM rust:1-slim-bookworm AS lib-builder
WORKDIR /root
COPY lib/ ./
RUN cargo build --release

FROM golang:1.22.2-bookworm as server-builder
WORKDIR /root
COPY . .
COPY --from=lib-builder /root/target/release/libyacht.a ./lib/
ENV CGO_ENABLED=1
RUN go build -o yachty-yachta .

FROM debian:bookworm-slim
WORKDIR /root/
COPY --from=server-builder /root/yachty-yachta .
EXPOSE 4434

CMD ["./yachty-yachta"]
