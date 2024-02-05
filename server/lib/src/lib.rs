mod simulation;

use libc::{c_double, c_int};

#[no_mangle]
pub extern "C" fn generate_rotation(
    num: c_int,
    r_result: *const c_int,
    r_translations: *const c_double,
    r_rotations: *const c_double,
) -> *mut c_double {
    let mut result = Vec::new();
    let mut translations = Vec::new();
    let mut rotations = Vec::new();

    unsafe {
        for i in 0..num {
            result.push(*r_result.add(i as usize));
        }

        for i in 0..num * 3 {
            translations.push(*r_translations.add(i as usize));
        }

        for i in 0..num * 4 {
            rotations.push(*r_rotations.add(i as usize));
        }
    }

    let mut buffer = Vec::with_capacity(4 * 5);

    // calculate initial rotations
    simulation::generate_rotation(
        &mut buffer,
        num,
        result,
        translations,
        rotations,
    );

    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

#[no_mangle]
pub extern "C" fn free_ptr(ptr: *mut c_double) {
    unsafe {
        if ptr.is_null() {
            return;
        }

        let size = 4 * 5;
        let _buffer = Vec::from_raw_parts(ptr, size, size);
    }
}

#[cfg(test)]
pub mod test {

    use super::*;

    #[test]
    fn simulated_main_function() {
        let ptr = generate_rotation(
            1,
            vec![1].as_mut_ptr(),
            vec![0.1, 0.1, 0.1].as_mut_ptr(),
            vec![0.1, 0.1, 0.1, 0.1].as_mut_ptr(),
        );

        unsafe {
            println!("first value: {}", *ptr);
        }

        free_ptr(ptr);
    }
}
