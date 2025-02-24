import React from "react";

const Footer = () => {
  return (
    <footer className="footer footer-center bg-base-300 text-base-content p-4 bottom-0">
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
