'use client';

import React from 'react';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';
import Image from 'next/image';
import icon from '@/public/images/icon/magic.png';
import about1 from '@/public/images/icon/airdrop.png';
import about2 from '@/public/images/icon/people.png';
import about3 from '@/public/images/icon/microphone.png';

const About: React.FC = () => {
  return (
    <section id="about" className="about m-lr">
      <div className="about-wrapper sec-bg pos-rel pb-130 pt-130">
        <div className="container">
          <div className="sec-title--two text-center">
            <Fade direction="down" triggerOnce={false} duration={1000} delay={9}>
              <div className="sub-title wow fadeInDown" data-wow-duration="600ms">
                <Image src={icon} alt="About Kisentra" />
                {' '}About Kisentra
              </div>
            </Fade>
            <Fade direction="down" triggerOnce={false} duration={1500} delay={9}>
              <h2 className="title wow fadeInDown" data-wow-delay="150ms" data-wow-duration="600ms">
                Quality Products for Your Daily Life
              </h2>
            </Fade>
          </div>

          <div className="row">
            {/* Left Column */}
            <div className="col-lg-6 mt-50">
              <div className="about-left">
                <h2 className="title">Core values</h2>

                <div className="about-item_box ul_li">
                  <div className="xb-item--icon">
                    <Image src={about1} alt="Quality icon" />
                  </div>
                  <div className="xb-item--holder">
                    <p className="xb-item--content">
                      <span>Quality First:</span> We offer premium BPA-free water bottles and food-grade tiffin boxes that are safe for daily use.
                    </p>
                  </div>
                </div>

                <div className="about-item_box ul_li">
                  <div className="xb-item--icon">
                    <Image src={about2} alt="Customer Focus icon" />
                  </div>
                  <div className="xb-item--holder">
                    <p className="xb-item--content">
                      <span>Customer Satisfaction:</span> Your happiness is our priority. We ensure every product meets the highest standards.
                    </p>
                  </div>
                </div>

                <div className="about-item_box ul_li">
                  <div className="xb-item--icon">
                    <Image src={about3} alt="Eco-Friendly icon" />
                  </div>
                  <div className="xb-item--holder">
                    <p className="xb-item--content">
                      <span>Sustainability:</span> We believe in eco-friendly products that help you lead a healthier, more sustainable lifestyle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-6 mt-50">
              <div className="about-right">
                <div className="xb-item--holder">
                  <h3 className="xb-item--title">Our Mission</h3>
                  <p className="xb-item--content">
                    Our mission is to provide high-quality, eco-friendly water bottles and tiffin boxes that help you stay hydrated and maintain a healthy lifestyle. We are committed to offering products that are safe, durable, and environmentally conscious.
                  </p>
                </div>
                <div className="xb-item--holder">
                  <h3 className="xb-item--title">Our Vision</h3>
                  <p className="xb-item--content">
                    Our vision is to become India's most trusted brand for premium lifestyle products, making quality water bottles and tiffin boxes accessible to everyone while promoting sustainable living practices.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="xb-btn text-center mt-90 wow fadeInUp" data-wow-duration="600ms">
              <Fade direction="up" triggerOnce={false} duration={1500} delay={9}>
                <Link href="/about" className="thm-btn thm-btn--aso">
                  Learn more about us
                </Link>
              </Fade>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
