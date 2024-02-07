build-web:
	cd web && pnpm run build

dev-web:
	cd web && pnpm run dev

install-web:
	cd web && pnpm i

fmt-web:
	cd web && pnpm run fmt

build-lib:
	cd server/lib && cargo build --release
	cp server/lib/target/release/libyacht.a server/lib/

test-lib:
	cd server/lib && cargo test -- --nocapture

fmt-lib:
	cd server/lib && rustfmt ./**/*.rs

build-server: build-lib
	cd server && go build .

dev-server: build-lib
	cd server && go run .

test-server: build-lib
	cd server && go test

fmt-server:
	cd server && gofmt -w ./*.go

install: install-web

build: build-server build-web

fmt: fmt-server fmt-web fmt-lib
