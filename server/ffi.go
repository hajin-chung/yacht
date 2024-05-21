package main

/*
#cgo LDFLAGS: -L./lib -lyacht -lm -static
#include "./lib/yacht.h"
*/
import "C"
import (
	"errors"
	"unsafe"
)

func GenerateSimulation(num int, result []int32) ([]float32, error) {
	if len(result) != num {
		return nil, errors.New("incorrect arguments size")
	}
	r_result := (*C.int)(unsafe.Pointer(&result[0]))

	ptr := C.generate_simulation(C.int(num), r_result)
	if ptr == nil {
		return nil, errors.New("simulation generation failed")
	}
	defer C.free_buffer(ptr)

	length := int(ptr.length)
	buffer := unsafe.Slice((*float32)(unsafe.Pointer(ptr.buffer)), length)

	return buffer, nil
}
