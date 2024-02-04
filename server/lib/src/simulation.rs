use rapier3d::prelude::*;

pub fn generate_rotation(
    buffer: &mut Vec<f32>,
    num: i32,
    _result: Vec<i32>,
    _translations: Vec<f32>,
    _rotations: Vec<f32>,
) {
    let debug = false;

    let fps = 30.0;

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

    collider_set.insert(top);
    collider_set.insert(bottom);
    collider_set.insert(left);
    collider_set.insert(right);
    collider_set.insert(ground);

    let mut dice_handles = Vec::new();
    for i in 0..num {
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![0., 1. + 2. * i as f32, 0.])
            .build();
        let collider = ColliderBuilder::cuboid(0.4, 0.4, 0.4);
        let dice_handle = rigid_body_set.insert(rigid_body);
        collider_set.insert_with_parent(
            collider,
            dice_handle,
            &mut rigid_body_set,
        );
        dice_handles.push(dice_handle);
    }

    let gravity = vector![0., -8.0, 0.];
    let mut integration_parameters = IntegrationParameters::default();
    integration_parameters.dt = 1. / fps;
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

    for dice_handle in &dice_handles {
        let dice_body: &RigidBody = &rigid_body_set[*dice_handle];
        let translation = dice_body.translation();

        if debug {
            println!("{} {} {}", translation.x, translation.y, translation.z);
        }
    }

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

        let mut is_dice_asleep = false;
        for dice_handle in &dice_handles {
            let dice_body: &RigidBody = &rigid_body_set[*dice_handle];
            if dice_body.is_sleeping() {
                is_dice_asleep = true;
            }

            let translation = dice_body.translation();
            let rotation = dice_body.rotation();

            if debug {
                println!(
                    "{} {} {}\n{} {} {} {}",
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

        if is_dice_asleep {
            break;
        }
    }

    for dice_handle in dice_handles.iter() {
        let dice_body: &RigidBody = &rigid_body_set[*dice_handle];
        let rotation = dice_body.rotation();
        buffer.push(rotation.i);
        buffer.push(rotation.j);
        buffer.push(rotation.k);
        buffer.push(rotation.w);
    }
}
