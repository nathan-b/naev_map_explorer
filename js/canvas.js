//
// Drawing / canvas stuff
// Runs in sandbox
//
function rotate(p, o, deg) {
  let dx = p.x - o.x;
  let dy = p.y - o.y;

  let x = dx * Math.cos(Math.radians(deg)) - dy * Math.sin(Math.radians(deg));
  let y = dx * Math.sin(Math.radians(deg)) + dy * Math.cos(Math.radians(deg));

  return new Point(x + o.x, y + o.y);
}

Math.degrees = function (radians) {
  return (radians * 180) / Math.PI;
};

Math.radians = function (degrees) {
  return (degrees * Math.PI) / 180;
};

class Point {
  x = 0;
  y = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Circle {
  x = 0;
  y = 0;
  r = 0;

  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  get radius() {
    return this.r;
  }

  get origin() {
    return new Point(this.x, this.y);
  }

  connecting_pts(other) {
    let p1, p2;

    if (this.x < other.x) {
      p1 = {
        ...this
      };
      p2 = {
        ...other
      };
    } else {
      p1 = {
        ...other
      };
      p2 = {
        ...this
      };
    }

    let dx = Math.abs(p1.x - p2.x);
    let dy = Math.abs(p1.y - p2.y);

    let alpha = Math.degrees(Math.atan(dy / dx));
    let beta = 90 - alpha;

    return [
      rotate(
        {
          ...p1,
          x: p1.x + p1.r
        },
        p1,
        (p2.y < p1.y ? 360 : alpha * 2) - alpha
      ),
      rotate(
        {
          ...p2,
          x: p2.x + p2.r
        },
        p2,
        (p2.y > p1.y ? 270 - 2 * beta : 90) + beta
      )
    ];
  }
}

function drawcircle(circ, color) {
  const canvas = document.getElementById("test");
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.arc(circ.x, circ.y, circ.r, 0, Math.PI * 2, true); // Circle
    ctx.stroke();
  }
}

function drawline(startx, starty, endx, endy, color) {
  const canvas = document.getElementById("test");
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.moveTo(startx, starty);
    ctx.lineTo(endx, endy);
    ctx.stroke();
  }
}

function draw_connection(circle1, circle2, color) {
  const canvas = document.getElementById("test");
  if (canvas.getContext) {
    const [p1, p2] = circle1.connecting_pts(circle2);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function label_circle(circle, text, color) {
  const canvas = document.getElementById("test");
  if (canvas.getContext) {
    const ctx = canvas.getContext("2d");
    ctx.font = "16px sans";
    ctx.fillStyle = color;
    ctx.fillText(text, circle.x + circle.r, circle.y - circle.r);
  }
}
