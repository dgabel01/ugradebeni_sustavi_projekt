import React from "react";

const Footer = () => {
  return (
    <footer className="footer footer-center bg-blue-gray-50 rounded-lg bg-blend-exclusion text-base-content p-4 bottom-0" style={{backgroundImage:"url('/Tekstura.png')"}}>
      <aside>
        <p className="font-semibold">
          Copyright © {new Date().getFullYear()} - Sva prava pridržana -
          Fakultet elektrotehnike, strojarstva i brodogradnje
        </p>
      </aside>
    </footer>
  );
};

export default Footer;
