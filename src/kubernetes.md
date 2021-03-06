---
layout: dev
title: Kubernetes Analysis
---

# Analysis of contributions to 
{: .blue #blue-h}

## Data used for this study

Statistics used in this report are dynamically collected from [CNCF's devstats server](https://devstats.cncf.io/){: #itemLink }

<div id="selection"></div>

### Stack

<div markdown="1" class="graph" data-clickable data-kind="stack" data-name="cip" data-metric="hcomcontributions" data-companies="all" data-periods="w,m,y,y10"></div>

### Contributions

<div markdown="1" class="graph" data-clickable data-kind="components" data-name="k8s" data-metric="hcomcontributions" data-companies="all" data-periods="w,m,y,y10" data-limit="6">
Google has more contributed to Kubernetes than any other big tech company.
{: .graphComment }
</div>

### Contributors

<div markdown="1" class="graph" data-clickable data-kind="components" data-name="k8s" data-metric="hcomcontributors" data-companies="Docker Inc.,IBM,Microsoft Corporation,Pivotal,Red Hat" data-periods="y,y10">
Long term contributors to Kubernetes (except Google and independents).
{: .graphComment }
</div>

<script data-kind="components" data-read-query="false">
  updateGraphs(true)
</script>
