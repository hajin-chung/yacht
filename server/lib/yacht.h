struct Buffer {
  int length;
  float *buffer;
};

struct Buffer *generate_simulation(int num, int *r_result);
void free_buffer(struct Buffer *ptr);
