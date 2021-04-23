function onBootstrap() {
  // Check if endpoint is set
  if (wp.wp_sls_forms_endpoint.length === 0) {
    // Display debug message for logged in users
    if (wp.is_user_logged_in.length !== 0) {
      console.log("WP Serverless Forms is installed but no endpoint is set.");
    }
    return;
  }
}

function success(el) {
  el.target.submit.disabled = false;
  el.target.querySelector('input[type="submit"]').blur();
  el.target.reset();

  // Redirect if set
  if (wp.wp_sls_forms_redirect.length > 0) {
    window.location.replace(wp.wp_sls_forms_redirect);
  }
}

function error(el) {
  el.target.querySelector('input[type="submit"]').disabled = false;
  alert("Oops! There was an error.");
}

function submitForm(method, url, data, el) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== XMLHttpRequest.DONE) return;
    if (xhr.status === 200) {
      success(el);
    } else {
      error(el);
    }
  };

  xhr.send(data);
}

function filterFormFieldsToKeyValueObject(fieldPrefix, formData) {
	var object = {};
	for (var entry of formData.entries()) {
		var key = entry[0];
		if (key.startsWith(fieldPrefix)) {
			var value = entry[1];
			object[key] = value;
		}
	}
	return object;
}

function buildTsdRfpJsonRequest(object) {
	var subject = 'Request for Proposal';
	
	var inputs = [];
	for (var key of Object.keys(object)) {
		var value = object[key];
		
		if (key.startsWith('tsd_rfp_bool')) {
			delete object[key];
			
			var newKey = key.replace('[]', '');
			
			var newValue = {};
			newValue['label'] = value;
			newValue['value'] = 'Yes';
			
			inputs.push(newValue);
		} else {
			if (key === "tsd_rfp_project_name") {
				subject += ': ' + value;
			};
			
			var label = '';
			var el = document.getElementById(key);
			if (el) {
				label = el.getAttribute("placeholder");
			}
			
			var newValue = {};
			newValue['label'] = label.replace('*', '');
			newValue['value'] = value;
			
			inputs.push(newValue);
		}
	}
	
	var fromAddress = 'tm.anonymous.1@gmail.com';
	var toAddresses = [];
	toAddresses.push('rgodwin.tsd@gmail.com');
	
	var request = {};
	request['tsd_rfp_from'] = fromAddress;
	request['tsd_rfp_tos'] = toAddresses;
	request['tsd_rfp_subject'] = subject;
	request['tsd_rfp_inputs'] = inputs;
	
 	return JSON.stringify(request);
}

function modifyFormAttributes(form) {
  form.removeAttribute("action");
  form.removeAttribute("method");
  form.removeAttribute("enctype");
  form.removeAttribute("novalidate");
  form.setAttribute("data-wp-sls-forms", true);
}

onBootstrap();

document.addEventListener("DOMContentLoaded", function () {
  const allForms = document.querySelectorAll(
    "form[data-shifter='true'], .wpcf7 form, .wpcf7-form, .gform_wrapper form, .wpforms-container form"
  );

  allForms.forEach((form) => {
    modifyFormAttributes(form);

    // Inputs
    const inputs = form.querySelectorAll("input");

    // Add HTML required attribute
    inputs.forEach((input) => {
      if (input.getAttribute("aria-required") === "true") {
        input.required = true;
      }
    });

    form.addEventListener("submit", function (el) {
      el.preventDefault();
		
      var data = new FormData(form);
	
      var object = filterFormFieldsToKeyValueObject('tsd_rfp', data);
      var json = buildTsdRfpJsonRequest(object);
		
	  submitForm("POST", wp.wp_sls_forms_endpoint, json, el);
    });
  });
});
