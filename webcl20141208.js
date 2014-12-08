$(function() {
  if (window.webcl === undefined) {
    alert('えっ、まだWebCL未対応ブラウザ使ってるの? 信じられない...');
    return false;
  }

  var kernelSource;

  var devices = getDevices();
  devices.forEach(function(d, i) {
    var platformName = d[0].getInfo(WebCL.PLATFORM_NAME);
    var deviceName = d[1].getInfo(WebCL.DEVICE_NAME);
    var label = platformName + ' - ' + deviceName;
    $('#devices').append($('<option>').html(label).val(i));
  });

  $('#run-button').click(function(){
    var width = +$('#width').val();
    var height = Math.floor(width / 1.5);
    var xStart = -2.0;
    var yStart = -1.0;
    var xStop = 1.0;
    var yStop = 1.0;
    var maxIter = +$('#max-iter').val();
    var threshold = 2.0;
    var bufSize = width * height * 4;

    var device = devices[$('#devices').val()][1];
    var canvas = $('#display')[0];
    $('#display').attr({
      width: width,
      height: height
    });
    var canvasContext = canvas.getContext('2d');
    var pixels = canvasContext.createImageData(width, height);

    var context = webcl.createContext(device);
    var queue = context.createCommandQueue(device);

    var program = context.createProgram(kernelSource);
    program.build([device]);
    var kernel = program.createKernel('mandelbrot');

    var start = new Date();

    var image = context.createImage(WebCL.MEM_WRITE_ONLY, {
      channelOrder: WebCL.RGBA,
      channelType: WebCL.UNSIGNED_INT8,
      width: width,
      height: height,
      rowPitch: 0
    });

    kernel.setArg(0, image);
    kernel.setArg(1, new Float32Array([xStart]));
    kernel.setArg(2, new Float32Array([yStart]));
    kernel.setArg(3, new Float32Array([xStop]));
    kernel.setArg(4, new Float32Array([yStop]));
    kernel.setArg(5, new Int32Array([maxIter]));
    kernel.setArg(6, new Float32Array([threshold]));

    queue.enqueueNDRangeKernel(kernel, 2, null, [width, height]);
    queue.enqueueReadImage(image, false, [0, 0], [width, height], width * 4, pixels.data);
    queue.finish();

    var stop = new Date();

    canvasContext.putImageData(pixels, 0, 0);
    $('#time').text((stop - start) / 1000);
  });

  $.get('kernel.cl')
    .done(function(src) {
      kernelSource = src;
      $('#run-button').attr('disabled', false);
    });

  function getDevices() {
    var result = [];
    webcl.getPlatforms().forEach(function(platform) {
      platform.getDevices().forEach(function(device) {
        result.push([platform, device]);
      });
    });
    return result;
  }
});
