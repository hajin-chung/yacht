package main

/*
#cgo LDFLAGS: ./lib/libyacht.a -ldl -lm
#include "./lib/yacht.h"
*/
import "C"
import (
	"errors"
	"fmt"
	"unsafe"
)

// generates rotations of each dice based on number of dice,
// translation and rotation of each dice and dice result
// returns each dice's initial rotation to achieve dice result
// translations are array of each position vector(3) concatenated
// rotations are array of each quaternion(4) concatenated
// returned []float64 are initial rotation quaternions(4) concatenated
func GenerateRotation(
	num int,
	result []int32,
	translations []float64,
	rotations []float64,
) ([]float64, error) {
	if len(result) != num || len(translations) != num*3 || len(rotations) != num*4 {
		return nil, errors.New("incorrect arguments size")
	}

	fmt.Printf("translations: %+v\n", translations)
	fmt.Printf("rotations: %+v\n", rotations)

	r_result := (*C.int)(unsafe.Pointer(&result[0]))
	r_translations := (*C.double)(unsafe.Pointer(&translations[0]))
	r_rotations := (*C.double)(unsafe.Pointer(&rotations[0]))
	ptr := C.generate_rotation(C.int(num), r_result, r_translations, r_rotations)

	buffer := unsafe.Slice((*float64)(unsafe.Pointer(ptr)), num*4)

	return buffer, nil
}
