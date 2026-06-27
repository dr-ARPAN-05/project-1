export function Icon({ icon: Ic, size = 18, color, style: s }) {
  return <Ic size={size} color={color || 'currentColor'} style={s} strokeWidth={1.8} />;
}
