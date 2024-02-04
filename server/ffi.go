package main

/*
#cgo LDFLAGS: ./physics/libyacht.a -ldl -lm
#include "./physics/yacht.h"
*/
import "C"
import "unsafe"

func GenerateFrames(num int) {
	ptr := C.roll(_Ctype_int(num))

	println("now go!")
	size := *(*uint32)(unsafe.Pointer(ptr))
	println(size)
	C.free_frames(ptr)
}
