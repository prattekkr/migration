export default class GoogleReCaptcha {
  id;

  name;

  config;

  formName;

  loadPromise;

  widgetId;

  constructor(config, id, name, formName) {
    this.config = config;
    this.name = name;
    this.id = id;
    this.formName = formName;
  }

  #loadScript(url) {
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        const head = document.head || document.querySelector('head');
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve(window.grecaptcha);
        script.onerror = () => reject(new Error(`Failed to load script ${url}`));
        head.append(script);
      });
    }
  }

  loadCaptcha(form) {
    if (form && this.config.siteKey) {
      const captchaContainer = form.querySelector(`#${this.id}`);
      if (!captchaContainer) {
        // eslint-disable-next-line no-console
        console.warn('Captcha can not be loaded. Captcha container is missing.');
        return;
      }
      const { siteKey } = this.config;
      const url = this.config.uri;
      if (this.config.version === 'enterprise') {
        this.#loadScript(`${url}?sitekey=${siteKey}`);
      } else {
        this.#loadScript('https://www.google.com/recaptcha/api.js');
      }
      this.loadPromise.then((grecaptcha) => {
        grecaptcha.ready(() => {
          this.widgetId = grecaptcha.render(captchaContainer, { sitekey: siteKey });
        });
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Captcha configuration is missing.');
      // eslint-disable-next-line no-alert
      alert('Captcha can not be loaded. Captcha configuration is missing.');
    }
  }

  async getToken() {
    if (!this.config.siteKey) {
      return null;
    }
    return new Promise((resolve) => {
      const { grecaptcha } = window;
      if (this.config.version === 'enterprise') {
        grecaptcha.enterprise.ready(async () => {
          const submitAction = `submit_${this.formName}_${this.name}`;
          const token = await grecaptcha.enterprise.execute(
            this.config.siteKey,
            { action: submitAction },
          );
          resolve(token);
        });
      } else {
        const token = grecaptcha.getResponse(this.widgetId);
        resolve(token);
      }
    });
  }
}