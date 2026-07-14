import { FiFacebook, FiInstagram, FiTwitter, FiMail, FiShield } from 'react-icons/fi';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h2>VoyageIQ</h2>
          <p>
            Thoughtful vacation planning for travelers who want organized trips, flexible choices,
            and clear budgets before takeoff.
          </p>
        </div>
        <div>
          <h3>About</h3>
          <p>Curated packages, AI-assisted itineraries, and booking-friendly trip details.</p>
        </div>
        <div>
          <h3>Contact</h3>
          <p>hello@voyageiq.com</p>
          <p>+1 415 555 0188</p>
        </div>
        <div>
          <h3>Privacy Policy</h3>
          <p>Travel preferences stay private and are used only to shape your planning experience.</p>
          <div className="footer__socials" aria-label="Social media">
            <a href="#" aria-label="Facebook">
              <FiFacebook />
            </a>
            <a href="#" aria-label="Instagram">
              <FiInstagram />
            </a>
            <a href="#" aria-label="Twitter">
              <FiTwitter />
            </a>
            <a href="#" aria-label="Email">
              <FiMail />
            </a>
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          <FiShield /> Secure booking experience
        </span>
        <span>© 2026 VoyageIQ. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;
