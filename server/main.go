package main

/*
#cgo LDFLAGS: ./physics/libyacht.a -ldl
#include "./physics/yacht.h"
*/
import "C"
import (
	// "reflect"
	"unsafe"
)

func main() {
	ptr := C.roll(5)

	println("now go!")
	size := *(*int)(unsafe.Pointer(ptr))
	println(size)
	C.free_frames(ptr)
}
