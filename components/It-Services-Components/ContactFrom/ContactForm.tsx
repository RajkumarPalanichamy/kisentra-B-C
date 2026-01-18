'use client';

import React, { useState, useRef } from 'react';
import SimpleReactValidator from 'simple-react-validator';
import icon1 from '@/public/images/icon/user-black.svg';
import icon2 from '@/public/images/icon/sms.svg';
import icon3 from '@/public/images/icon/call.svg';
import icon4 from '@/public/images/icon/company-icon.svg';
import icon5 from '@/public/images/icon/sms-white-icon01.svg';
import Image from 'next/image';

interface FormState {
  name: string;
  email: string;
  subject: string;
  phone: string;
  company: string;
  message: string;
}

const ContactForm: React.FC = () => {
  const [forms, setForms] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    phone: '',
    company: '',
    message: '',
  });

  const [, forceUpdate] = useState(0); // To trigger re-render for validation messages

  const validator = useRef(
    new SimpleReactValidator({
      className: 'errorMessage',
      messages: {
        required: 'This field is required',
        email: 'Invalid email address',
        phone: 'Invalid phone number',
        alpha_space: 'Only letters and spaces allowed',
      },
    })
  );

  // Call this on input change and blur
  const changeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForms({ ...forms, [e.target.name]: e.target.value });
    if (validator.current.allValid()) {
      validator.current.hideMessages();
      forceUpdate((x) => x + 1);
    }
  };

  const submitHandler = (e: React.FormEvent) => {
    e.preventDefault();

    if (validator.current.allValid()) {
      validator.current.hideMessages();
      forceUpdate((x) => x + 1);

      // Submit your form data here or do whatever on success
      console.log('Form submitted', forms);

      // Reset form
      setForms({
        name: '',
        email: '',
        subject: '',
        phone: '',
        company: '',
        message: '',
      });
    } else {
      validator.current.showMessages();
      forceUpdate((x) => x + 1);
    }
  };

  return (
    <form className="contact-form" onSubmit={submitHandler} noValidate>
      <div className="row">
        <div className="col-lg-6">
          <div className="input-field pos-rel">
            <input
              value={forms.name}
              type="text"
              name="name"
              className="form-control"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="Goladria Gomez"
            />
            {validator.current.message('name', forms.name, 'required|alpha_space')}
            <div className="img">
              <Image src={icon1} alt="User icon" />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="input-field pos-rel">
            <input
              value={forms.email}
              type="email"
              name="email"
              className="form-control"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="sales@kisentraglobal.com"
            />
            {validator.current.message('email', forms.email, 'required|email')}
            <div className="img">
              <Image src={icon2} alt="Email icon" />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="input-field pos-rel">
            <input
              value={forms.phone}
              type="tel"
              name="phone"
              className="form-control"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="+8250-3560 6565"
            />
            {validator.current.message('phone', forms.phone, 'required|phone')}
            <div className="img">
              <Image src={icon3} alt="Phone icon" />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="input-field pos-rel">
            <input
              value={forms.company}
              type="text"
              name="company"
              className="form-control"
              onBlur={changeHandler}
              onChange={changeHandler}
              placeholder="Company Name"
            />
            {validator.current.message('company', forms.company, 'required')}
            <div className="img">
              <Image src={icon4} alt="Company icon" />
            </div>
          </div>
        </div>
        <div className="col-lg-12">
          <div className="input-field text-field pos-rel">
            <textarea
              value={forms.message}
              name="message"
              className="form-control"
              placeholder="How can we help you?"
              onBlur={changeHandler}
              onChange={changeHandler}
            />
            {validator.current.message('message', forms.message, 'required')}
            <div className="img">
              <Image src={icon2} alt="Message icon" />
            </div>
          </div>
        </div>
      </div>
      <div className="contact-btn">
        <button type="submit" className="thm-btn btn-effect_2">
          Let’s talk <Image src={icon5} alt="Send icon" />
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
