import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.brand}>
          <div style={s.dot} />
          <div style={s.title}>Your account</div>
          <div style={s.subtitle}>You are signed in</div>
        </div>

        <div style={s.row}>
          <span style={s.key}>Email</span>
          <span style={s.val}>{user?.email}</span>
        </div>

        <div style={s.row}>
          <span style={s.key}>Role</span>
          <div style={s.pill}>
            <div style={s.pillDot} />
            {user?.role}
          </div>
        </div>

        <button onClick={logout} style={s.logoutBtn}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const s = {
  bg: {
    minHeight: '100vh',
    background: '#0f1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#1a1d27',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  brand: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'white',
    margin: '0 auto 12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '500',
    color: 'white',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  key: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.5px',
  },
  val: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
  },
  pillDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#4ade80',
  },
  logoutBtn: {
    width: '100%',
    padding: '11px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    background: 'transparent',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    marginTop: '24px',
  },
};