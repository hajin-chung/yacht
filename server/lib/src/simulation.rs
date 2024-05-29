use rapier3d::{
    na::{Quaternion, Unit, UnitQuaternion, Vector3},
    prelude::*,
};
use std::f32::consts::PI;

pub fn simulate(buffer: &mut Vec<f32>, result: &Vec<i32>, num: i32) {
    let num = num as usize;

    let fps = 60.0;

    let mut rigid_body_set = RigidBodySet::new();
    let mut collider_set = ColliderSet::new();

    let wall_w = 5.65;
    let wall_h = 3.0;
    let wall_d = 0.16;

    let friction = 0.4;
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
    let ground = ColliderBuilder::cuboid(100., 1., 100.)
        .translation(vector![0., -0.8, 0.])
        .friction(friction)
        .friction_combine_rule(CoefficientCombineRule::Max)
        .restitution(restitution)
        .build();

    collider_set.insert(left);
    collider_set.insert(right);
    collider_set.insert(top);
    collider_set.insert(bottom);
    collider_set.insert(ground);

    let translations = vec![
        vector![2., 3., 0.],
        vector![1.5, 4., 1.],
        vector![1.5, 4., -1.],
        vector![2.5, 4., 0.5],
        vector![2.5, 4., -0.5],
    ];

    let mut dice_handles = Vec::new();
    for i in 0..num {
        let mut rigid_body = RigidBodyBuilder::dynamic().build();
        let translation = translations[i];
        let rotation = Unit::from_euler_angles(
            PI * rand::random::<f32>(),
            PI * rand::random::<f32>(),
            PI * rand::random::<f32>(),
        );

        rigid_body.set_translation(translation, true);
        rigid_body.set_rotation(rotation, true);
        rigid_body.set_linvel(
            vector![
                -4.0 + 2.0 * (rand::random::<f32>() - 0.5),
                -0.1,
                rand::random::<f32>() - 0.5
            ],
            true,
        );

        let dice_handle = rigid_body_set.insert(rigid_body);

        let mut collider = ColliderBuilder::cuboid(0.4, 0.4, 0.4).build();
        collider.set_mass(10.0);
        collider_set.insert_with_parent(
            collider,
            dice_handle,
            &mut rigid_body_set,
        );

        dice_handles.push(dice_handle);
    }

    let gravity = vector![0., -16.0, 0.];
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
            if dice_body.linvel().magnitude() > 0.001
                || dice_body.angvel().magnitude() > 0.0001
            {
                is_dice_moving = true;
            }

            let translation = dice_body.translation();
            buffer.push(translation.x);
            buffer.push(translation.y);
            buffer.push(translation.z);
            let rotation = dice_body.rotation();
            buffer.push(rotation.i);
            buffer.push(rotation.j);
            buffer.push(rotation.k);
            buffer.push(rotation.w);
        }

        if !is_dice_moving {
            break;
        }
    }

    let face_vectors = vec![
        Vector3::new(0.0, 1.0, 0.0),
        Vector3::new(0.0, 0.0, 1.0),
        Vector3::new(-1.0, 0.0, 0.0),
        Vector3::new(1.0, 0.0, 0.0),
        Vector3::new(0.0, 0.0, -1.0),
        Vector3::new(0.0, -1.0, 0.0),
    ];
    let up_vector = Vector3::new(0.0, 1.0, 0.0);

    let mut rotations = Vec::new();

    for i in 0..num {
        let dice_body = &rigid_body_set[dice_handles[i]];
        let dice_rotation = dice_body.position().rotation;
        let mut max_product = -1.0;
        let mut face = 0;

        for j in 0..6 {
            let face_vector = dice_rotation * face_vectors[j];
            let product = up_vector.dot(&face_vector);
            if product > max_product {
                max_product = product;
                face = j + 1;
            }
        }

        let rotation_matrix;
        if face as i32 == result[i] {
            rotation_matrix =
                UnitQuaternion::from_axis_angle(&Vector3::x_axis(), 0.0);
        } else if face as i32 + result[i] == 7 {
            let axis = Vector3::x_axis();
            rotation_matrix =
                UnitQuaternion::from_axis_angle(&axis, -std::f32::consts::PI);
        } else {
            let face_vector = dice_rotation * face_vectors[face - 1];
            let result_vector =
                dice_rotation * face_vectors[result[i] as usize - 1];
            let axis = face_vector.cross(&result_vector).normalize();
            rotation_matrix = UnitQuaternion::from_axis_angle(
                &UnitVector::new_normalize(axis),
                -std::f32::consts::PI / 2.0,
            );
        }
        rotations.push(rotation_matrix);
    }

    for i in 0..buffer.len() / (7 * num) {
        for j in 0..num {
            let start = i * 7 * num + 7 * j + 3;
            let existing_quaternion =
                UnitQuaternion::from_quaternion(Quaternion::new(
                    buffer[start + 3],
                    buffer[start],
                    buffer[start + 1],
                    buffer[start + 2],
                ));
            let correct_rotation = rotations[j] * existing_quaternion;
            buffer[start] = correct_rotation.i;
            buffer[start + 1] = correct_rotation.j;
            buffer[start + 2] = correct_rotation.k;
            buffer[start + 3] = correct_rotation.w;
        }
    }
}
