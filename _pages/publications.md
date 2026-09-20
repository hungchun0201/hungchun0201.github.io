---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
archive_class: publications
---

<p class="publications__intro">Journal and conference papers, listed by publication year. See also <a href="{{ site.author.googlescholar | escape }}">Google Scholar</a>.</p>

{% include base_path %}

{% assign publications = site.publications | sort: 'date' | reverse %}
{% assign current_year = '' %}
{% for post in publications %}
{% unless post.publication_type == 'thesis' %}
{% assign year = post.date | date: '%Y' %}
{% if year != current_year %}
<h2 class="publications__year">{{ year }}</h2>
{% assign current_year = year %}
{% endif %}
{% include publication-item.html %}
{% endunless %}
{% endfor %}

<h2 class="publications__year">Thesis</h2>
{% for post in publications %}
{% if post.publication_type == 'thesis' %}
{% include publication-item.html %}
{% endif %}
{% endfor %}
