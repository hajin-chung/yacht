mod frames;

use frames::generate_frames;

#[no_mangle]
pub extern "C" fn roll(num: i32) -> *mut f32 {
    let mut buffer = Vec::<f32>::new();
    buffer.push(0.0);

    generate_frames(num, &mut buffer);

    let size = buffer.len() as u32;
    let embedded_size = f32::from_bits(size);
    buffer[0] = embedded_size;

    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer); // Correctly prevent Rust from deallocating the vector's memory
    ptr
}

#[no_mangle]
pub extern "C" fn free_frames(ptr: *mut f32) {
    unsafe {
        if ptr.is_null() {
            return;
        }
        // Retrieve the size correctly as a floating point value
        let size_as_f32 = *ptr;
        let size = size_as_f32.to_bits() as usize; // Convert the f32 back to bits, then to usize

        // Correctly reconstruct the Vec with the proper size and capacity
        // Assuming the size includes the size slot itself
        let _buffer = Vec::from_raw_parts(ptr, size, size);
    }
}

// This is present so it's easy to test that the code works natively in Rust via `cargo test`
#[cfg(test)]
pub mod test {

    use super::*;

    // This is meant to do the same stuff as the main function in the .go files
    #[test]
    fn simulated_main_function() {
        let ptr = roll(5);
        unsafe {
            let embedded = *ptr;
            let size: u32 = embedded.to_bits();
            println!("size: {}", size);
            if size > 20 {
                println!("pointer value: {}", *(ptr.wrapping_add(10)));
            }
        }
    }
}
