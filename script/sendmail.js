const $ = (id) => document.querySelector(id)
const sendmail = {
  _copyToClipboard: (text) => {
    // https://stackoverflow.com/a/30810322
    if (!navigator.clipboard) {
      let textArea = document.createElement("textarea")
      textArea.value = text

      // Avoid scrolling to bottom
      textArea.style.top = "0"
      textArea.style.left = "0"
      textArea.style.position = "fixed"

      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        let successful = document.execCommand('copy')
        let msg = successful ? 'successful' : 'unsuccessful'
        console.log('Fallback: Copying text command was ' + msg)
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err)
      }

      document.body.removeChild(textArea)
      return
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!')
    }, function(err) {
      console.error('Async: Could not copy text: ', err)
    })
  },

  copy: () => {
    if (this.validate().result) {
      this._copyTextToClipboard(this.serialize())
      $('#success').classList.add('visible')
    }
  },

  reset: () => {
    ['recipient', 'cc', 'bcc', 'subject', 'body'].forEach(function(el){
      $('#field-' + el).value = ''
    })
    $('#field-recipient').focus()
    this.update()
  },

  serialize: () => {
    const cc = $('#field-cc').value.replace(/\s/g, '').split(','),
      bcc = $('#field-bcc').value.replace(/\s/g, '').split(',')
      subject = encodeURIComponent($('#field-subject').value),
      body = encodeURIComponent($('#field-body').value)
    let query_string = []

    for (let i = 0; i < cc.length; i++) {
      if (cc[i].length) {
        query_string.push('cc=' + encodeURIComponent(cc[i]))
      }
    }
    for (let i = 0; i < bcc.length; i++) {
      if (bcc[i].length) {
        query_string.push('bcc=' + encodeURIComponent(bcc[i]))
      }
    }
    query_string.push('subject=' + subject)
    query_string.push('body=' + body)
    
    let link = 'mailto:' + encodeURIComponent($('#field-recipient').value) + '?'
    return link + query_string.join('&')
  },

  shorten: () => {
    if (this.validate().result) {
      fetch('https://api.shrtco.de/v2/shorten?url=' + url)
        .then((response) => response.json())
        .then((result) => {
          if (result.ok) {
            console.log('Link shortened successfully')
            console.log(result)
          } else {
            return Promise.reject(result)
          }
        })
        .catch((response) => {
          const { error_code, error } = response
          console.error('Could not shorten link (error ' + error_code + ': ' + error + ')')
        })
    }
  },

  toggle_buttons: (state) => {
    if (state) {
      $('#submit').classList.remove('disabled')
      $('#shorten').classList.remove('disabled')
    } else {
      $('#submit').classList.add('disabled')
      $('#shorten').classList.add('disabled')
    }
  },

  update: () => {
    const validation = sendmail.validate()
    sendmail.toggle_buttons(validation.result)
    if (validation.result) {
      $('#result').value = sendmail.serialize()
    } else {
      $('#result').value = validation.cause
    }

    // Toggle delete button
    let total_chars = 0
    ['recipient', 'cc', 'bcc', 'subject', 'body'].forEach(function(el){
      total_chars += $('#field-' + el).value.length
    })
    if (total_chars) {
      $('#reset').classList.add('visible')
    } else {
      $('#reset').classList.remove('visible')
    }

    // Update char count
    $('#charcount').innerText = $('#field-body').value.length + '/1500'
    $('#success').classList.remove('visible')
  },

  validate: () => {
    const recipient = $('#field-recipient').value,
      cc = $('#field-cc').value.replace(/\s/g, '').split(','),
      bcc = $('#field-bcc').value.replace(/\s/g, '').split(','),
      subject = $('#field-subject').value,
      body = $('#field-body').value,
      validate_email = (email) => {
        const re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
        return re.test(String(email).toLowerCase())
      }

    // Validate recipient
    if (recipient.length) {
      if (!validate_email(recipient)) {
        return { result: false, cause: 'Invalid recipient email address.'}
      }
    } else {
      return { result: false, cause: 'Enter a recipient email address.' }
    }

    // Validate CC and BCC
    if ($('#field-cc').value.length) {
      for (let i = 0; i < cc.length; i++) {
        if (!cc[i].length || !validate_email(cc[i])) {
          return { result: false, cause: 'Invalid cc email address(es).'}
        }
      }
    }
    if ($('#field-bcc').value.length) {
      for (let i = 0; i < bcc.length; i++) {
        if (!bcc[i].length || !validate_email(bcc[i])) {
          return { result: false, cause: 'Invalid bcc email address(es).'}
        }
      }
    }

    // Validate subject and body
    if (subject.length > 78) {
      return { result: false, cause: 'Subject is too long.'}
    } else if (!subject.length) {
      return { result: false, cause: 'Enter a subject.' }
    }
    if (body.length > 1500) {
      return { result: false, cause: 'Body is too long.'}
    } else if (!body.length) {
      return { result: false, cause: 'Enter a body.' }
    }

    return { result: true, cause: null }
  },
}
