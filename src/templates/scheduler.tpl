'use strict';

{% include '../core/libs.js' %}

var monitors = [
{% for monitor in monitors %}
  {
    name : '{{ monitor.name }}',
    url  : '{{ monitor.url }}',
    token: '{{ monitor.token }}'
  },
{% endfor %}
];

{% include '../core/core.js' %}

