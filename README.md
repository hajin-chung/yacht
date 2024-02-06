# yacht

realtime 3d secure yacht dice game

# goals

- [x] basic 3d rendering structure
- [x] basic box rendering
- [x] basic ambient & directional light
- [x] basic cup rendering
- [x] dice texture
- [x] board texture
- [x] cup texture
- [x] client side 3d physics simulation
- [ ] authorization & authentication
- [ ] match making
- [ ] private & public room
- [ ] server side game logic
- [ ] database management
- [ ] dice result detection
- [ ] client side game logic
- [ ] server side 3d physics simulation
- [ ] sending server side simulated dice rotations to client side
- [ ] various game effects
- [ ] frontend stuff

# server architecture 

1. implement basic websocket pub sub hub.
2. try docker, k8s, rabbitMQ, ...

for database seperate user and game datas
one sqlite3 user.db and for game datas use redis or memcached
