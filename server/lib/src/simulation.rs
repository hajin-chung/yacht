use rapier3d_f64::{
    na::{Quaternion, Unit, UnitQuaternion},
    prelude::*,
};

pub fn generate_rotation(
    buffer: &mut Vec<f64>,
    num: i32,
    result: Vec<i32>,
    translations: Vec<f64>,
    rotations: Vec<f64>,
) {
    let num = num as usize;
    let debug = true;

    if debug {
        println!("translations: {:?}", translations);
        println!("rotations: {:?}", rotations);
    }

    let fps = 60.0;

    let mut rigid_body_set = RigidBodySet::new();
    let mut collider_set = ColliderSet::new();

    let wall_w = 5.35;
    let wall_h = 4.0;
    let wall_d = 0.2;

    let friction = 0.5;
    let restitution = 0.6;

    let top = ColliderBuilder::cuboid(wall_w / 2., wall_h, wall_d / 2.)
        .translation(vector![0., wall_h / 2., -wall_w / 2. - wall_d / 2.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();
    let bottom = ColliderBuilder::cuboid(wall_w / 2., wall_h, wall_d / 2.)
        .translation(vector![0., wall_h / 2., wall_w / 2. + wall_d / 2.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();
    let left = ColliderBuilder::cuboid(wall_d / 2., wall_h, wall_w / 2.)
        .translation(vector![-wall_w / 2. - wall_d / 2., wall_h / 2., 0.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();
    let right = ColliderBuilder::cuboid(wall_d / 2., wall_h, wall_w / 2.)
        .translation(vector![wall_w / 2. + wall_d / 2., wall_h / 2., 0.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();
    let ground = ColliderBuilder::cuboid(10., 1., 10.)
        .translation(vector![0., -1., 0.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();

    collider_set.insert(left);
    collider_set.insert(right);
    collider_set.insert(top);
    collider_set.insert(bottom);
    collider_set.insert(ground);

    let mut dice_handles = Vec::new();
    for _ in 0..num {
        let rigid_body = RigidBodyBuilder::dynamic().build();
        let dice_handle = rigid_body_set.insert(rigid_body);

        let mut collider = ColliderBuilder::cuboid(0.4, 0.4, 0.4).build();
        collider.set_mass(0.5);
        collider_set.insert_with_parent(
            collider,
            dice_handle,
            &mut rigid_body_set,
        );

        dice_handles.push(dice_handle);
    }

    for i in 0..num {
        let body = &mut rigid_body_set[dice_handles[i]];
        body.set_translation(
            vector![
                translations[3 * i],
                translations[3 * i + 1],
                translations[3 * i + 2],
            ],
            false,
        );
        body.set_rotation(
            Rotation::from_quaternion(Quaternion::new(
                rotations[4 * i],
                rotations[4 * i + 1],
                rotations[4 * i + 2],
                rotations[4 * i + 3],
            )),
            false,
        );
        body.set_linvel(vector![0., 0., 0.], false);
        body.set_angvel(vector![0., 0., 0.], false);
        body.reset_forces(false);
        body.reset_torques(false);

        println!("{} {}", body.linvel(), body.angvel());
        println!("{}", body.is_sleeping());
        println!("{}", body.translation());
        println!("{}", body.rotation().as_vector());
        println!("{}", body.mass());
        println!("{}", body.next_position());

        body.add_force(vector![-0.6, -0.1, 0.1], false);
    }

    let gravity = vector![0., -8.0, 0.];
    let mut integration_parameters = IntegrationParameters::default();
    let mut physics_pipeline = PhysicsPipeline::new();
    let mut island_manager = IslandManager::new();
    let mut broad_phase = BroadPhase::new();
    let mut narrow_phase = NarrowPhase::new();
    let mut impulse_joint_set = ImpulseJointSet::new();
    let mut multibody_joint_set = MultibodyJointSet::new();
    let mut ccd_solver = CCDSolver::new();
    let mut query_pipeline = QueryPipeline::new();
    let physics_hooks = ();
    let event_handler = ();

    integration_parameters.dt = 1. / fps;

    loop {
        let dice_body: &RigidBody = &rigid_body_set[dice_handles[0]];
        let translation = dice_body.translation();
        let rotation = dice_body.rotation();
        if debug {
            if !dice_body.is_sleeping() {
                println!(
                    "{} {} {} {} {} {} {}",
                    translation.x,
                    translation.y,
                    translation.z,
                    rotation.i,
                    rotation.j,
                    rotation.k,
                    rotation.w
                );
            }
        }

        physics_pipeline.step(
            &gravity,
            &integration_parameters,
            &mut island_manager,
            &mut broad_phase,
            &mut narrow_phase,
            &mut rigid_body_set,
            &mut collider_set,
            &mut impulse_joint_set,
            &mut multibody_joint_set,
            &mut ccd_solver,
            Some(&mut query_pipeline),
            &physics_hooks,
            &event_handler,
        );

        let mut is_dice_moving = false;
        for i in 0..num {
            let dice_body: &RigidBody = &rigid_body_set[dice_handles[i]];
            if dice_body.is_moving() {
                is_dice_moving = true;
            }
        }

        if !is_dice_moving {
            break;
        }
    }

    // TODO: detect which face is up and caculate the initial rotation
    // of dice to achieve the desired result
    let face_vectors = vec![
        vector![0., 1., 0.],
        vector![0., 0., 1.],
        vector![1., 0., 0.],
        vector![-1., 0., 0.],
        vector![0., 0., -1.],
        vector![0., -1., 0.],
    ];
    let up_vector = vector![0., 1., 0.];

    for i in 0..(num) {
        let dice_body: &RigidBody = &rigid_body_set[dice_handles[i]];
        let rotation = dice_body.rotation();
        let rotation_matrix = rotation.to_rotation_matrix();
        let mut max_product = 0.;
        let mut face = 0;

        for j in 0..6 {
            let face_vector = rotation_matrix * face_vectors[j];
            let product = up_vector.dot(&face_vector);
            if product > max_product {
                max_product = product;
                face = j + 1;
            }
        }

        let dice_vector = rotation * face_vectors[0];
        let target_face = (result[i] - 1) as usize;
        println!("{} {}", face, target_face);

        let axis_vector = face_vectors[target_face].cross(&dice_vector);
        let axis = Unit::new_normalize(axis_vector);
        let angle = face_vectors[target_face].angle(&dice_vector);
        let face_rotation = UnitQuaternion::from_axis_angle(&axis, angle);
        let original_rotation =
            UnitQuaternion::from_quaternion(Quaternion::from_vector(vector![
                rotations[4 * i],
                rotations[4 * i + 1],
                rotations[4 * i + 2],
                rotations[4 * i + 3],
            ]));

        let rotation_matrix = face_rotation.to_rotation_matrix()
            * original_rotation.to_rotation_matrix();
        let rotation = UnitQuaternion::from_rotation_matrix(&rotation_matrix);
        buffer.push(rotation.i);
        buffer.push(rotation.j);
        buffer.push(rotation.k);
        buffer.push(rotation.w);
    }
}
