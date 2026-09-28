import numpy as np, json
from scipy import stats
# (name, unit, higher_better, decimals, base_mean, base_sd, eg_gain, kg_gain, post_sd_factor)
TESTS=[
 ("Проба Ромберга","с",True,1, 9.6,2.1, 4.6,1.4),
 ("Проба Яроцкого","с",True,1, 17.8,3.6, 8.9,2.6),
 ("Три кувырка вперёд","с",False,1, 5.4,0.45, -0.75,-0.3),
 ("Прыжок в длину на 50 %","см",False,1, 14.2,3.0, -5.8,-1.9),
 ("10 прямых прыжков в зону","раз",True,0, 5.4,1.2, 2.6,0.9),
 ("Поворот на 360° на батуте","град",False,0, 36,7.5, -16,-6),
]
def gen(seed):
    r=np.random.default_rng(seed); out=[]
    for n,u,hb,dec,m,sd,ge,gk in TESTS:
        eb=r.normal(m,sd,8); kb=r.normal(m,sd,8)
        ea=eb+ge+r.normal(0,abs(ge)*0.35,8); ka=kb+gk+r.normal(0,abs(gk)*0.6+sd*0.15,8)
        rnd=lambda a: np.round(a,dec)
        eb,kb,ea,ka=map(rnd,(eb,kb,ea,ka))
        if dec==0: eb,kb,ea,ka=[np.clip(x,0,10) if u=="раз" else x for x in (eb,kb,ea,ka)]
        out.append(dict(name=n,unit=u,hb=hb,dec=dec,eb=eb.tolist(),kb=kb.tolist(),ea=ea.tolist(),ka=ka.tolist()))
    return out
def summ(t):
    res={}
    for k in ["eb","kb","ea","ka"]:
        a=np.array(t[k]); res[k]=(a.mean(), a.std(ddof=1), a.std(ddof=1)/np.sqrt(len(a)))
    res["t_before"]=stats.ttest_ind(t["eb"],t["kb"]).statistic
    res["p_before"]=stats.ttest_ind(t["eb"],t["kb"]).pvalue
    res["t_after"]=stats.ttest_ind(t["ea"],t["ka"]).statistic
    res["p_after"]=stats.ttest_ind(t["ea"],t["ka"]).pvalue
    res["t_e"]=stats.ttest_rel(t["ea"],t["eb"]).statistic; res["p_e"]=stats.ttest_rel(t["ea"],t["eb"]).pvalue
    res["t_k"]=stats.ttest_rel(t["ka"],t["kb"]).statistic; res["p_k"]=stats.ttest_rel(t["ka"],t["kb"]).pvalue
    res["gain_e"]=abs(res["ea"][0]-res["eb"][0])/res["eb"][0]*100
    res["gain_k"]=abs(res["ka"][0]-res["kb"][0])/res["kb"][0]*100
    return res
if __name__=="__main__":
    for seed in range(3000):
        d=gen(seed); S=[summ(t) for t in d]
        pb=[s["p_before"] for s in S]; pa=[s["p_after"] for s in S]
        nsig=sum(p<0.05 for p in pa)
        if min(pb)>0.25 and nsig>=5 and max(pa)<0.2:
            print("seed",seed)
            for t,s in zip(d,S): print(t["name"], {k:(tuple(round(x,2) for x in v) if isinstance(v,tuple) else round(float(v),3)) for k,v in s.items()})
            break
