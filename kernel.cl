__kernel void mandelbrot(
  write_only image2d_t out,
  float xStart,
  float yStart,
  float xStop,
  float yStop,
  int max_iter,
  float threshold
)
{
  const int i = get_global_id(0);
  const int j = get_global_id(1);
  const int width = get_global_size(0);
  const int height = get_global_size(1);
  const float cr = (xStop - xStart) / width * i + xStart;
  const float ci = (yStop - yStart) / height * j + yStart;
  float zr = 0.0f;
  float zi = 0.0f;
  float zrzi, zr2, zi2;
  int k;
  for(k = 0; k < max_iter; k++) {
    zrzi = zr * zi;
    zr2 = zr * zr;
    zi2 = zi * zi;
    zr = zr2 - zi2 + cr;
    zi = zrzi + zrzi + ci;
    if(zi2 + zr2 >= threshold) {
      break;
    }
  }
  const int level = 255 - 255 * k / max_iter;
  const int2 pos = (int2)(i, j);
  const uint4 pixel = (uint4)(level, level, level, 255);
  write_imageui(out, pos, pixel);
}
