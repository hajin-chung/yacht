build-web:
	cd web && pnpm run build

dev-web:
	cd web && pnpm run dev

install-web:
	cd web && pnpm i

build-lib:
	cd server/lib && cargo build --release
	cp server/lib/target/release/libyacht.a server/lib/

test-lib:
	cd server/lib && cargo test -- --nocapture

build-server: build-lib
	cd server && go build .

dev-server: build-lib
	cd server && go run .

test-server: build-lib
	cd server && go test

install: install-web
