'use client';

import React, { FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import icon1 from '@/public/images/icon/sms-white.svg';
import icon2 from '@/public/images/icon/call-white.svg';
import icon3 from '@/public/images/icon/location.svg';
import icon4 from '@/public/images/icon/sms02.svg';
import Services from '../../api/service';

interface FooterProps {}

const SubmitHandler = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer
      className="footer footer-style-two pt-200 bg_img pos-rel"
      style={{ backgroundColor: '#0c111d' }}
    >
      <div className="container">
        <div className="xb-footer pt-120">
          {/* Contact Info */}
          <div className="footer-info ul_li_between">
            <div className="info-item ul_li">
              <div className="xb-item--icon">
                <span>
                  <Image src={icon1} alt="Email Icon" />
                </span>
              </div>
              <div className="xb-item--holder">
                <p className="xb-item--content">Write to us</p>
                <h4 className="xb-item--title">sales@kisentraglobal.com</h4>
              </div>
            </div>
            <div className="info-item ul_li">
              <div className="xb-item--icon clr-blue">
                <span>
                  <Image src={icon2} alt="Call Icon" />
                </span>
              </div>
              <div className="xb-item--holder">
                <p className="xb-item--content">Call Us</p>
                <h4 className="xb-item--title">+91 93929 38283</h4>
              </div>
            </div>
            <div className="info-item ul_li">
              <div className="xb-item--icon clr-sky">
                <span>
                  <Image src={icon3} alt="Location Icon" />
                </span>
              </div>
              <div className="xb-item--holder">
                <p className="xb-item--content">Our Office</p>
                <h4 className="xb-item--title">Coimbatore, Tamil Nadu, India</h4>
              </div>
            </div>
          </div>

          {/* Footer Widgets */}
          <div className="footer-inner mt-70 mb-100 ul_li_between align-items-start">
            {/* Newsletter */}
            <div className="sa-newslatter footer-widget">
              <span className="xb-item--sub-title">Newsletter</span>
              <p className="xb-item--content clr-white">
                Sign up to get exclusive deals, new product launches, and special offers on water bottles & tiffin boxes.
              </p>
              <form className="xb-item--input_field pos-rel" onSubmit={SubmitHandler}>
                <input type="email" name="gmail" id="text6" placeholder="Enter your email" required />
                <div className="img">
                  <Image src={icon4} alt="Mail Icon" />
                </div>
                <button type="submit" className="xb-item--btn">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
              <span className="xb-item--text">
                By continuing, you agree to our{' '}
                <Link href="/terms-conditions">Terms</Link> of Use and{' '}
                <Link href="/privacy-policy">Privacy Policy</Link>
              </span>
            </div>

            {/* Quick Links */}
            <div className="footer-widget">
              <span className="xb-item--sub-title">Quick Links</span>
              <ul className="xb-item--holder list-unstyled">
                <li className="xb-item--list"><Link href="/about">About us</Link></li>
                <li className="xb-item--list"><Link href="/products">All Products</Link></li>
                <li className="xb-item--list"><Link href="/contact">Contact</Link></li>
                <li className="xb-item--list"><Link href="/cart">Shopping Cart</Link></li>
                <li className="xb-item--list"><Link href="/terms-conditions">Terms & Conditions</Link></li>
                <li className="xb-item--list"><Link href="/privacy-policy">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Product Categories */}
            <div className="footer-widget">
              <span className="xb-item--sub-title">Shop by Category</span>
              <ul className="xb-item--holder list-unstyled">
                <li className="xb-item--list"><Link href="/products?category=Water Bottles">Water Bottles</Link></li>
                <li className="xb-item--list"><Link href="/products?category=Tiffin Boxes">Tiffin Boxes</Link></li>
                <li className="xb-item--list"><Link href="/products?category=Stainless Steel">Stainless Steel</Link></li>
                <li className="xb-item--list"><Link href="/products?category=Plastic">Plastic</Link></li>
                <li className="xb-item--list"><Link href="/products?category=Glass">Glass</Link></li>
                <li className="xb-item--list"><Link href="/products">View All Products</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="footer-widget">
              <span className="xb-item--sub-title">Customer Service</span>
              <ul className="xb-item--holder list-unstyled">
                <li className="xb-item--list"><Link href="/contact">Help & Support</Link></li>
                <li className="xb-item--list"><Link href="/contact">Shipping Info</Link></li>
                <li className="xb-item--list"><Link href="/contact">Returns & Exchanges</Link></li>
                <li className="xb-item--list"><Link href="/contact">Track Your Order</Link></li>
                <li className="xb-item--list"><Link href="/contact">FAQs</Link></li>
                <li className="xb-item--list"><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-copyright mt-70 ul_li_between">
            <p className="copyright mt-20">
              Copyright © 2025 <Link href="/">Kisentra</Link>. All rights reserved.
            </p>
            <ul className="footer-link ul_li mt-20">
              <li><span>Follow us :</span></li>
              <li><Link href="/"><i className="fab fa-twitter"></i></Link></li>
              <li><Link href="/"><i className="fab fa-facebook-f"></i></Link></li>
              <li><Link href="/"><i className="fab fa-linkedin-in"></i></Link></li>
              <li><Link href="/"><i className="fab fa-youtube"></i></Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
