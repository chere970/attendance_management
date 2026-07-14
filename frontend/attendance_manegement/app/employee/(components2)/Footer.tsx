export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-sm text-slate-500">
        <p>AttendHub — employee attendance & leave management</p>
        <p>© {year}</p>
      </div>
    </footer>
  );
};

export default Footer;
