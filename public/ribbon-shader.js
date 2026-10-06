// Shared by the lightweight chapter renderer and the Three.js Work material.
// All visible color/detail comes from the original artwork texture.
export const ribbonShader = `
float band(float x, float a, float b, float feather) {
  return smoothstep(a, a + feather, x) * (1. - smoothstep(b - feather, b, x));
}
float boxMask(vec2 p, vec4 rect) {
  return band(p.x, rect.x, rect.z, .012) * band(p.y, rect.y, rect.w, .012);
}
float ribbonColor(vec3 color) {
  float hi = max(color.r, max(color.g, color.b));
  float lo = min(color.r, min(color.g, color.b));
  return smoothstep(.075, .24, hi - lo) * smoothstep(.22, .5, hi);
}
float ribbonMask(vec2 uv, vec3 color, float kind) {
  vec2 p = vec2(uv.x, 1. - uv.y);
  float mask = ribbonColor(color);
  // Pin the texture boundaries, leaving the source silhouette in place.
  mask *= band(p.x, 0., 1., .018) * band(p.y, 0., 1., .018);
  if (kind > .5 && kind < 1.5) {
    // Portrait silhouette and the three baked annotation pins, in source UVs.
    float head = 1. - smoothstep(.93, 1.08, length((p - vec2(.755,.29)) / vec2(.112,.30)));
    float shoulder = smoothstep(.48, .76, p.y);
    float front = .725 + .195 * exp(-pow((p.x - .755) / .16, 2.));
    float torso = band(p.x, mix(.66,.515,shoulder), mix(.835,.94,shoulder), .018)
                * smoothstep(.47,.52,p.y) * (1. - smoothstep(front - .025, front, p.y));
    float pins = max(boxMask(p, vec4(.43,.48,.484,.705)),
                 max(boxMask(p, vec4(.58,.285,.624,.468)), boxMask(p, vec4(.898,.17,.977,.37))));
    mask *= 1. - max(max(head, torso), pins);
  }
  if (kind > 1.5 && kind < 2.5) {
    // Preserve project cards and lettering. The ribbon crossing the glass
    // remains animated below its label, along with the exposed connectors.
    float objects = max(boxMask(p,vec4(0.,0.,.315,1.)),
                    max(boxMask(p,vec4(.585,0.,.818,1.)), boxMask(p,vec4(.845,0.,.99,1.))));
    float label = boxMask(p,vec4(.335,0.,.55,.49));
    mask *= (1. - max(objects, label)) * (1. - smoothstep(.83,.9,p.y));
  }
  return mask;
}
vec4 flowingRibbon(sampler2D art, vec2 uv, float time, float enabled, float kind) {
  vec4 original = texture2D(art, uv);
  float mask = ribbonMask(uv, original.rgb, kind) * enabled;
  if (mask < .001) return original;
  // Two overlapping, forward-moving samples form a continuous stream, with
  // no hard wrap or whole-image sliding. Keep displacement inside the ribbon.
  float phase = fract(time * .19);
  float second = fract(phase + .5);
  float blend = abs(phase * 2. - 1.);
  vec2 direction = vec2(.026, .009 * cos(uv.x * 9. + uv.y * 3.));
  float flowCoordinate = uv.x * 18. + uv.y * 6.;
  if (kind > 2.5) {
    // The Experience artwork is a loop: follow its tangent, not a straight pan.
    vec2 radial = (uv - vec2(.685,.515)) / vec2(.31,.36);
    direction = normalize(vec2(-radial.y,radial.x) + vec2(.0001)) * vec2(.024,.021);
    flowCoordinate = atan(radial.y,radial.x) * 3.;
  }
  vec2 ripple = vec2(0., sin(uv.x * 12. - time * 1.9) * .004);
  vec2 a = clamp(uv - direction * (phase - .5) * mask + ripple * mask, .001, .999);
  vec2 b = clamp(uv - direction * (second - .5) * mask + ripple * mask, .001, .999);
  vec4 sampleA = texture2D(art,a), sampleB = texture2D(art,b);
  vec4 moving = mix(sampleA, sampleB, blend);
  // Do not drag a pale edge, lettering, or portrait pixels into the ribbon.
  float safe = min(ribbonColor(sampleA.rgb), ribbonColor(sampleB.rgb));
  vec4 result = mix(original, moving, mask * safe);
  float sheen = pow(.5 + .5 * sin(flowCoordinate - time * 2.8), 9.);
  result.rgb += (vec3(1.) - result.rgb) * sheen * .19 * mask * safe;
  result.a = original.a;
  return result;
}
`;
