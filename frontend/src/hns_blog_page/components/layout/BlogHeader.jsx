import { Link } from 'react-router-dom';

<nav className="hidden sm:flex items-center gap-4 text-sm font-semibold">
  <a href="#projects">Projects</a>
  <a href="#buy">Buy</a>
  <Link to="/blogs">Blog</Link>
  <a href="#contact">Contact Us</a>
  <a href="/login">Login / Signup</a>
</nav>

{showMenu && (
  <div className="absolute left-0 top-full w-full mt-2 bg-white text-[#223A5F] rounded-b-xl px-6 py-5 sm:hidden flex flex-col gap-3 text-sm font-semibold z-30 shadow-lg">
    <a href="#projects" className="hover:text-blue-700">Projects</a>
    <a href="#buy" className="hover:text-blue-700">Buy</a>
    <Link to="/blogs" className="hover:text-blue-700">Blog</Link>
    <a href="#contact" className="hover:text-blue-700">Contact Us</a>
    <a href="/login" className="hover:text-blue-700">Login / Signup</a>
  </div>
)} 