mod simulation;

#[repr(C)]
pub struct Buffer {
    length: i32,
    buffer: *mut f32,
}

#[no_mangle]
pub extern "C" fn generate_simulation(
    num: i32,
    r_result: *const i32,
) -> *mut Buffer {
    let mut buffer = Vec::new();
    let mut result = Vec::new();

    unsafe {
        for i in 0..num {
            result.push(*r_result.add(i as usize))
        }
    }

    simulation::simulate(&mut buffer, &result, num);
    let ptr = buffer.as_mut_ptr();

    let result = Box::new(Buffer {
        buffer: ptr,
        length: buffer.len() as i32,
    });

    std::mem::forget(buffer);
    Box::into_raw(result)
}

#[no_mangle]
pub extern "C" fn free_buffer(ptr: *mut Buffer) {
    unsafe {
        if ptr.is_null() {
            return;
        }

        let buffer = Box::from_raw(ptr);
        Vec::from_raw_parts(
            buffer.buffer,
            buffer.length as usize,
            buffer.length as usize,
        );
    }
}

#[cfg(test)]
pub mod test {

    use super::*;
    use std::time::Instant;

    #[test]
    fn simulated_main_function() {
        let start = Instant::now();
        let ptr = generate_simulation(5, vec![1, 2, 3, 5, 6].as_mut_ptr());
        let duration = start.elapsed();

        unsafe {
            let length = (*ptr).length as usize;
            println!("took {:?}\n", duration);
            println!(
                "buffer: {} {} {} {} {}",
                (*ptr).length,
                *(*ptr).buffer.add(length - 4),
                *(*ptr).buffer.add(length - 3),
                *(*ptr).buffer.add(length - 2),
                *(*ptr).buffer.add(length - 1),
            );
        }

        free_buffer(ptr);
    }
}
