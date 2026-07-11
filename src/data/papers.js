export const papers = [
    {
        title: "Extending the saemix package for R to fit non Gaussian outcomes",
        authors: "Emmanuelle Comets, Maud Delattre, Belhal Karimi",
        venue: "arXiv preprint arXiv:2603.03154, 2026",
        links: { pdf: "https://arxiv.org/pdf/2603.03154" },
        thumbnail: "/assets/industry/saemix.png"
    },
    {
        title: "STANLEY: Stochastic Gradient Anisotropic Langevin Dynamics for Learning Energy-Based Models",
        authors: "Belhal Karimi, Jianwen Xie, Ping Li",
        venue: "arXiv preprint arXiv:2310.12667, 2023",
        links: { pdf: "https://arxiv.org/pdf/2310.12667.pdf" },
        thumbnail: "/assets/paperthumb/stanley.png",
        abstract: "We propose in this paper, STANLEY, a STochastic gradient ANisotropic LangEvin dYnamics, for sampling high dimensional data. With the growing efficacy and potential of Energy-Based modeling, also known as non-normalized probabilistic modeling, for modeling a generative process of different natures of high dimensional data observations, we present an end-to-end learning algorithm for Energy-Based models (EBM) with the purpose of improving the quality of the resulting sampled data points. While the unknown normalizing constant of EBMs makes the training procedure intractable, resorting to Markov Chain Monte Carlo (MCMC) is in general a viable option. Realizing what MCMC entails for the EBM training, we propose in this paper, a novel high dimensional sampling method, based on an anisotropic stepsize and a gradient-informed covariance matrix, embedded into a discretized Langevin diffusion. We motivate the necessity for an anisotropic update of the negative samples in the Markov Chain by the nonlinearity of the backbone of the EBM, here a Convolutional Neural Network. Our resulting method, namely STANLEY, is an optimization algorithm for training Energy-Based models via our newly introduced MCMC method. We provide a theoretical understanding of our sampling scheme by proving that the sampler leads to a geometrically uniformly ergodic Markov Chain. Several image generation experiments are provided in our paper to show the effectiveness of our method."
    },
    {
        title: "Layer-wise and Dimension-wise Locally Adaptive Federated Learning",
        authors: "Belhal Karimi, Xiaoyun Li, Ping Li",
        venue: "UAI 2023",
        links: { pdf: "https://openreview.net/pdf?id=Q06wKxnHRv" },
        thumbnail: "/assets/paperthumb/layerwise.png",
        abstract: "In the emerging paradigm of Federated Learning (FL), large amount of clients such as mobile devices are used to train possibly high-dimensional models on their respective data. Combing (dimension-wise) adaptive gradient methods (e.g., Adam, AMSGrad) with FL has been an active direction, which is shown to outperform traditional SGD based FL in many cases. In this paper, we focus on the problem of training federated deep neural networks, and propose a novel FL framework which further introduces layer-wise adaptivity to the local model updates to accelerate the convergence of adaptive FL methods. Our framework includes two variants based on two recent locally adaptive federated learning algorithms. Theoretically, we provide a convergence analysis of our layer-wise FL methods, coined Fed-LAMB and Mime-LAMB, which match the convergence rate of state-of-the-art results in adaptive FL and exhibits linear speedup in terms of the number of workers. Experimental results on various datasets and models, under both IID and non-IID local data settings, show that both Fed-LAMB and Mime-LAMB achieve faster convergence speed and better generalization performance, compared to various recent adaptive FL methods."
    },
    {
        title: "FeatureBox: Feature Engineering on GPUs for Massive-Scale Ads Systems",
        authors: "Weijie Zhao, Xuewu Jiao, Xinsheng Luo, Jingxue Li, Belhal Karimi, Ping Li",
        venue: "IEEE BigData 2022",
        links: { pdf: "https://arxiv.org/pdf/2210.07768.pdf" },
        thumbnail: "/assets/paperthumb/featurebox.png",
        abstract: "Deep learning has been widely deployed for online ads systems to predict Click-Through Rate (CTR). Machine learning researchers and practitioners frequently retrain CTR models to test their new extracted features. However, the CTR model training often relies on a large number of raw input data logs. Hence, the feature extraction can take a significant proportion of the training time for an industrial-level CTR model. In this paper, we propose FeatureBox, a novel end-toend training framework that pipelines the feature extraction and the training on GPU servers to save the intermediate I/O of the feature extraction. We rewrite computation-intensive feature extraction operators as GPU operators and leave the memoryintensive operator on CPUs. We introduce a layer-wise operator scheduling algorithm to schedule these heterogeneous operators. We present a light-weight GPU memory management algorithm that supports dynamic GPU memory allocation with minimal overhead. We experimentally evaluate FeatureBox and compare it with the previous inproduction feature extraction framework on two real-world ads applications. The results confirm the effectiveness of our proposed method."
    },
    {
        title: "On the Convergence of Decentralized Adaptive Gradient Methods",
        authors: "Xiangyi Chen, Belhal Karimi, Weijie Zhao, Ping Li",
        venue: "ACML 2022",
        links: { pdf: "./assets/downloads/dams.pdf" },
        thumbnail: "/assets/paperthumb/dams.png",
        abstract: "Adaptive gradient methods including Adam, AdaGrad, and their variants have been very successful for training deep learning models, such as neural networks. Meanwhile, given the need for distributed computing, distributed optimization algorithms are rapidly becoming a focal point. With the growth of computing power and the need for using machine learning models on mobile devices, the communication cost of distributed training algorithms needs careful consideration. In this paper, we introduce novel convergent decentralized adaptive gradient methods and rigorously incorporate adaptive gradient methods into decentralized training procedures. Specifically, we propose a general algorithmic framework that can convert existing adaptive gradient methods to their decentralized counterparts. In addition, we thoroughly analyze the convergence behavior of the proposed algorithmic framework and show that if a given adaptive gradient method converges, under some specific conditions, then its decentralized counterpart is also convergent. We illustrate the benefit of our generic decentralized framework on a prototype method, i.e., AMSGrad, both theoretically and numerically."
    },
    {
        title: "Variational Flow Graphical Model",
        authors: "Shaogang Ren, Belhal Karimi, Dingcheng Li, Ping Li",
        venue: "SIGKDD 2022",
        links: { pdf: "./assets/downloads/kdd_vfg.pdf" },
        thumbnail: "/assets/paperthumb/vfg.png",
        abstract: "This paper introduces a novel approach to embed flow-based models with hierarchical structures. The proposed model learns the representation of high dimensional data via a message-passing scheme by integrating flow-based functions through variational inference. Meanwhile, our model produces a representation of the data using a lower dimension, thus overcoming the drawbacks of many flow-based models, usually requiring a high dimensional latent space involving many trivial variables. With the proposed aggregation nodes, the model provides a new approach for distribution modeling and numerical inference on datasets. Multiple experiments on synthetic and real datasets show the benefits of our proposed method highlighting our method’s benefits."
    },
    {
        title: "Dual Energy-Flow Enhanced Graph Neural Network for Visual Question Answering",
        authors: "Hao Li, Xu Li, Belhal Karimi, Jie Chen, Mingming Sun",
        venue: "ICME 2022",
        links: { pdf: "./assets/downloads/degnn.pdf" },
        thumbnail: "/assets/paperthumb/degnnthumb.png",
        abstract: "Scene graph, as a structural abstraction of natural images, contains massive, detailed information. Modeling visual reasoning through scene graphs can significantly improve the ability and strengthen the interpretability of reasoning. However, neither does one of these models jointly exploit objects, relations, and attributes information in scene graph, nor does one of them balance the importance of objects and relations. In this paper, we introduce a novel Dual Energy-Flow Enhanced Graph Neural Network (DE-GNN), which learns a comprehensive representation by encoding full-scale scene graph information from objects, attributes, and relations. Specifically, two types of scene graph structures are employed in the encoder: (i) Object-significant graph which embeds attribute and relation information into node representations. (ii) Relation-significant graph which intensifies the model perception of relation features. In addition, we design an energy-flow mechanism to enhance the information transferred from edges and adjacent nodes to updating nodes. We conduct extensive experiments on public GQA and Visual Genome datasets and achieve new state-of-the-art performances highlighting our method’s benefits."
    },
    {
        title: "On Distributed Adaptive Optimization with Gradient Compression",
        authors: "Xiaoyun Li, Belhal Karimi, Ping Li",
        venue: "ICLR 2022",
        links: { pdf: "https://openreview.net/pdf?id=CI-xXX9dg9l" },
        thumbnail: "/assets/paperthumb/compams.png",
        abstract: "We study COMP-AMS, a distributed optimization framework based on gradient averaging and adaptive AMSGrad algorithm. Gradient compression is applied to reduce the communication in the gradient transmission process, whose bias is corrected by the tool of error feedback. Our convergence analysis of COMPAMS shows that such gradient averaging strategy yields same convergence rate as standard AMSGrad, and also exhibits linear speedup effect w.r.t. the number of local workers. Compared with recently proposed protocols on distributed adaptive methods, COMP-AMSis simple and convenient. Numerical experiments are conducted to justify the theoretical findings, and demonstrate that the proposed method can achieve same test accuracy as full-gradient AMSGrad with substantial communication savings. With its simplicity and efficiency, COMP-AMScan serve as a useful distributed training framework for adaptive methods."
    },
    {
        title: "Minimization by Incremental Stochastic Surrogate for large-scale nonconvex Optimization",
        authors: "Belhal Karimi, Hoi-To Wai, Eric Moulines, Ping Li",
        venue: "ALT 2022",
        links: { pdf: "./assets/downloads/misso.pdf", poster: "./assets/downloads/altmissoposter.pdf", slides: "./assets/downloads/altmissoslides.pdf", video: "https://www.youtube.com/watch?v=pAKplpr0yv8&t=14s" },
        thumbnail: "/assets/paperthumb/misso.png",
        abstract: "Many nonconvex optimization problems can be solved using the Majorization- Minimization (MM) algorithm that consists in upper bounding, at each iteration of the algorithm, the objective function by a surrogate that is easier to minimize. When the objective function can be expressed as a large sum of individual losses, incremental version of the MM algorithm is often used. However, in many cases of interest (Generalized Linear Mixed Model or Variational Bayesian inference) those surrogates are intractable. In this contribution, we propose a generalization of incremental MM algorithm using Monte Carlo approximation of these surrogates. We establish the convergence of our unifying scheme for possibly nonconvex objective. Finally, we apply our new framework to train a logistic regression and a Bayesian neural network on the MNIST dataset and compare its convergence behaviour with state-of-the-art optimization methods."
    },
    {
        title: "An Optimistic Acceleration of AMSGrad for Nonconvex Optimization",
        authors: "Jun-Kun Wang, Xiaoyun Li, Belhal Karimi, Ping Li",
        venue: "ACML 2021",
        links: { pdf: "https://arxiv.org/abs/1903.01435" },
        thumbnail: "/assets/paperthumb/opt.png",
        abstract: "We propose a new variant of AMSGrad [Reddi et. al., 2018], a popular adaptive gradient-based optimization algorithm widely used for training deep neural networks. Our algorithm adds prior knowledge about the sequence of consecutive mini-batch gradients and leverages its underlying structure making the gradients sequentially predictable. By exploiting the predictability and ideas from optimistic online learning, the proposed algorithm can accelerate the convergence and increase sample efficiency. After establishing a tighter upper bound under some convexity conditions on the regret, we offer a complimentary view of our algorithm which generalizes the offline and stochastic version of nonconvex optimization. In the nonconvex case, we establish a non-asymptotic convergence bound independently of the initialization. We illustrate the practical speedup on several deep learning models via numerical experiments."
    },
    {
        title: "Two-Timescale Stochastic EM Algorithms",
        authors: "Belhal Karimi, Ping Li",
        venue: "ISIT 2021",
        links: { pdf: "https://hal.archives-ouvertes.fr/hal-02994707v1", code: "https://github.com/BelhalK/PapersCode/tree/master/ttsem", video: "https://www.youtube.com/watch?v=N8xR9Axuwnc" },
        thumbnail: "/assets/paperthumb/ttsem.png",
        abstract: "The Expectation-Maximization (EM) algorithm is a popular choice for learning latent variable models. Variants of the EM have been initially introduced by Neal and Hinton (1998), using in- cremental updates to scale to large datasets, and by Wei and Tanner (1990); Delyon et al. (1999), using Monte Carlo (MC) approximations to bypass the intractable conditional expectation of the latent data for most nonconvex models. In this paper, we propose a general class of methods called Two-Timescale EM Methods based on a two-stage approach of stochastic updates to tackle an es- sential nonconvex optimization task for latent variable models. We motivate the choice of a double dynamic by invoking the variance reduction virtue of each stage of the method on both sources of noise: the index sampling for the incremental update and the MC approximation. We establish finite-time and global convergence bounds for nonconvex objective functions. Numerical applica- tions on various models such as deformable template for image analysis or nonlinear mixed-effects models for pharmacokinetics are also presented to illustrate our findings."
    },
    {
        title: "HWA: Hyperparameters Weight Averaging in Bayesian Neural Networks",
        authors: "Belhal Karimi, Ping Li",
        venue: "AABI 2021",
        links: { pdf: "https://hal.archives-ouvertes.fr/hal-03087352v1", video: "https://www.youtube.com/watch?v=tB_50k_utDI" },
        thumbnail: "/assets/paperthumb/hwa.png",
        abstract: "Bayesian neural networks attempt to combine the strong predictive performance of neural networks with formal quantification of uncertainty of the predicted output in the Bayesian framework. In deterministic deep neural network, confidence of the model and the predic- tions at inference time are left alone. Applying randomness and Bayes Rule to the weights of a deep neural network is a step towards achieving this goal. Current state of the art optimization methods for training Bayesian Neural Networks are relatively slow and in- efficient, compared to their deterministic counterparts. In this paper, we propose HWA (Hyperparameters Weight Averaging) algorithm that exploits an averaging procedure in order to optimize faster and achieve better accuracy. We develop our main algorithm us- ing the simple averaging heuristic and demonstrate its effectiveness on the space of the hyperparameters of the networks random weights. Numerical applications are presented to confirm the empirical benefits of our method."
    },
    {
        title: "Towards Better Generalization of Adaptive Gradient Methods",
        authors: "Yingxue Zhou, Belhal Karimi, Jinxing Yu, Zhiqiang Xu, Ping Li",
        venue: "NeurIPS 2020",
        links: { pdf: "https://proceedings.neurips.cc/paper/2020/file/08fb104b0f2f838f3ce2d2b3741a12c2-Paper.pdf", poster: "./assets/downloads/sagdposter.pdf" },
        thumbnail: "/assets/paperthumb/sagd.png",
        abstract: "Adaptive gradient methods such as AdaGrad, RMSprop and Adam have been optimizers of choice for deep learning due to their fast training speed. However, it was recently observed that their generalization performance is often worse than that of SGD for over-parameterized neural networks. While new algorithms (such as AdaBound) have been proposed to improve the situation, the provided analyses are only committed to optimization bounds for the training objective, leaving critical generalization capacity unexplored. To close this gap, we propose Stable Adaptive Gradient Descent (SAGD) for non-convex optimization which leverages differential privacy to boost the generalization performance of adaptive gradient methods. Theoretical analyses show that SAGD has high-probability convergence to a population stationary point. We further conduct experiments on various popular deep learning tasks and models. Experimental results illustrate that SAGD is empirically competitive and often better than baselines."
    },
    {
        title: "FedSKETCH: Communication-Efficient Federated Learning via Sketching",
        authors: "Farzin Haddadpour, Belhal Karimi, Ping Li, Xiaoyun Li",
        venue: "arXiv 2020",
        links: { pdf: "https://arxiv.org/abs/2008.04975" },
        thumbnail: "/assets/paperthumb/fedsketch.png",
        abstract: "Communication complexity and privacy are the two key challenges in Federated Learning where the goal is to perform a distributed learning through a large volume of devices. In this work, we introduce FedSKETCH and FedSKETCHGATE algorithms to address both challenges in Federated learning jointly, where these algorithms are intended to be used for homogeneous and heterogeneous data distribution settings respectively. The key idea is to compress the accumulation of local gradients using count sketch, therefore, the server does not have access to the gradients themselves which provides privacy. Furthermore, due to the lower dimension of sketching used, our method exhibits communication-efficiency property as well. We provide, for the aforementioned schemes, sharp convergence guarantees. Finally, we back up our theory with various set of experiments."
    },
    {
        title: "f-SAEM: A fast Stochastic Approximation of the EM algorithm",
        authors: "Belhal Karimi, Marc Lavielle, Eric Moulines",
        venue: "CSDA 2020",
        links: { pdf: "https://hal.inria.fr/hal-01958248v1", code: "https://github.com/belhal/saemix" },
        thumbnail: "/assets/paperthumb/fsaem.png",
        abstract: "The ability to generate samples of the random effects from their conditional distributions is fundamental for inference in mixed effects models. Random walk Metropolis is widely used to perform such sampling, but this method is known to converge slowly for high dimensional problems, or when the joint structure of the distributions to sample is spatially heterogeneous. We propose an independent Metropolis-Hastings (MH) algorithm based on a multidimensional Gaussian proposal that takes into account the joint conditional distribution of the random effects and does not require any tuning. Indeed, this distribution is automatically obtained thanks to a Laplace approximation of the incomplete data model. We show that such approximation is equivalent to linearizing the structural model in the case of continuous data. Numerical experiments based on simulated and real data illustrate the performance of the proposed methods. In particular, we show that the suggested MH algorithm can be efficiently combined with a stochastic approximation version of the EM algorithm for maximum likelihood estimation in nonlinear mixed effects models."
    },
    {
        title: "On the Global Convergence of (Fast) Incremental Expectation Maximization Methods",
        authors: "Belhal Karimi, Hoi-To Wai, Eric Moulines, Marc Lavielle",
        venue: "NeurIPS 2019",
        links: { pdf: "https://arxiv.org/abs/1910.12521", code: "https://github.com/belhal/PapersCode/tree/master/fiem" },
        thumbnail: "/assets/paperthumb/fiem.png",
        abstract: "The EM algorithm is one of the most popular algorithm for inference in latent data models. The original formulation of the EM algorithm does not scale to large data set, because the whole data set is required at each iteration of the algorithm. To alleviate this problem, Neal and Hinton have proposed an incremental version of the EM (iEM) in which at each iteration the conditional expectation of the latent data (E-step) is updated only for a mini-batch of observations. Another approach has been proposed by Cappé and Moulines in which the E-step is replaced by a stochastic approximation step, closely related to stochastic gradient. In this paper, we analyze incremental and stochastic version of the EM algorithm as well as the variance reduced-version of Chen et. al. in a common unifying framework. We also introduce a new version incremental version, inspired by the SAGA algorithm by Defazio et. al. We establish non-asymptotic convergence bounds for global convergence. Numerical applications are presented in this article to illustrate our findings."
    },
    {
        title: "Non-asymptotic Analysis of Biased Stochastic Approximation Scheme",
        authors: "Belhal Karimi, Blazej Miasojedow, Eric Moulines, Hoi-To Wai",
        venue: "COLT 2019",
        links: { pdf: "https://arxiv.org/abs/1902.00629" },
        thumbnail: "/assets/paperthumb/nonas.png",
        abstract: "Stochastic approximation (SA) is a key method used in statistical learning. Recently, its non-asymptotic convergence analysis has been considered in many papers. However, most of the prior analyses are made under restrictive assumptions such as unbiased gradient estimates and convex objective function, which significantly limit their applications to sophisticated tasks such as online and reinforcement learning. These restrictions are all essentially relaxed in this work. In particular, we analyze a general SA scheme to minimize a non-convex, smooth objective function. We consider update procedure whose drift term depends on a state-dependent Markov chain and the mean field is not necessarily of gradient type, covering approximate second-order method and allowing asymptotic bias for the one-step updates. We illustrate these settings with the online EM algorithm and the policy-gradient method for average reward maximization in reinforcement learning."
    },
    {
        title: "Nonconvex Optimization for Latent Data Models: Algorithms, Analysis and Applications",
        authors: "Belhal Karimi",
        venue: "Ph.D. Thesis 2019",
        links: { pdf: "https://tel.archives-ouvertes.fr/tel-02319140/document", slides: "./assets/downloads/slidesDefense.pdf" },
        thumbnail: "/assets/paperthumb/phd.png",
        abstract: "Many problems in machine learning pertain to tackling the minimization of a possibly non-convex and non-smooth function defined on a Many problems in machine learning pertain to tackling the minimization of a possibly non-convex and non-smooth function defined on a Euclidean space.Examples include topic models, neural networks or sparse logistic regression.Optimization methods, used to solve those problems, have been widely studied in the literature for convex objective functions and are extensively used in practice.However, recent breakthroughs in statistical modeling, such as deep learning, coupled with an explosion of data samples, require improvements of non-convex optimization procedure for large datasets.This thesis is an attempt to address those two challenges by developing algorithms with cheaper updates, ideally independent of the number of samples, and improving the theoretical understanding of non-convex optimization that remains rather limited.In the first part, we consider the minimization of a (possibly) non-convex and non-smooth objective function using incremental and online updates.To that end, we propose several algorithms exploiting the latent structure to efficiently optimize the objective and illustrate our findings with numerous applications.In the second part, we focus on the maximization of non-convex likelihood using the EM algorithm and its stochastic variants.We analyze several faster and cheaper algorithms and propose two new variants aiming at speeding the convergence of the estimated parameters."
    },
    {
        title: "Scaling Saemix, a dedicated R package for nonlinear mixed effects modeling",
        authors: "Belhal Karimi, Emmanuelle Comets",
        venue: "CZI Proposal 2019",
        links: { pdf: "./assets/downloads/czi.pdf", code: "https://github.com/saemixdevelopment" },
        thumbnail: "/assets/paperthumb/czi.png",
        abstract: "The saemix package for R (in CRAN) provides maximum likelihood estimates of parame- ters in nonlinear mixed effect models (NLMEM), using a modern and efficient estimation algorithm, the Stochastic Approximation of the Expectation-Maximisation (SAEM), introduced in Kuhn and Lavielle (2005). This algorithm is a state-of-the-art method for fitting, possibly nonlinear, models in agronomy, animal breeding or Pharmacokinetics- Pharmacodynamics (PKPD) analysis. This prpoposal aims to increase our visibility, our userbase and attract new contributors by extending and improving the saemix package features and to refresh the documentation with modern examples, ensure maintenance and reproducibility of the contributed experiments."
    },
    {
        title: "Efficient Metropolis-Hastings sampling for nonlinear mixed effects models",
        authors: "Belhal Karimi, Marc Lavielle",
        venue: "BAYSM 2018",
        links: { pdf: "https://hal.inria.fr/hal-01958247v1", code: "https://github.com/belhal/saemix" },
        thumbnail: "/assets/paperthumb/eff.png",
        abstract: "The ability to generate samples of the random effects from their conditional distributions isLavielle, Marc fundamental for inference in mixed effects models. Random walk Metropolis is widely used to conduct such sampling, but such a method can converge slowly for medium dimension problems, or when the joint structure of the distributions to sample is complex. We propose a Metropolis--Hastings (MH) algorithm based on a multidimensional Gaussian proposal that takes into account the joint conditional distribution of the random effects and does not require any tuning, in contrast with more sophisticated samplers such as the Metropolis Adjusted Langevin Algorithm or the No-U-Turn Sampler that involve costly tuning runs or intensive computation. Indeed, this distribution is automatically obtained thanks to a Laplace approximation of the original model. We show that such approximation is equivalent to linearizing the model in the case of continuous data. Numerical experiments based on real data highlight the very good performances of the proposed method for continuous data model."
    },
    {
        title: "On the Convergence Properties of the Mini-Batch EM and MCEM Algorithms",
        authors: "Belhal Karimi, Marc Lavielle, Eric Moulines",
        venue: "DS3 2017",
        links: { pdf: "https://hal.inria.fr/hal-02334485v1" },
        thumbnail: "/assets/paperthumb/iem.png",
        abstract: "The EM algorithm is one of the most popular algorithm for inference in latent data models. For large datasets, each iteration of the algorithm can be numerically involved. To alleviate this problem, (Neal and Hinton, 1998) has proposed an incremental version in which the conditional expectation of the latent data (E-step) is computed on a mini-batch of observations. In this paper, we analyse this variant and propose and analyse the Monte Carlo version of the incremental EM in which the conditional expectation is evaluated by a Markov Chain Monte Carlo (MCMC). We establish the almost-sure convergence of these algorithms, covering both the mini-batch EM and its stochastic version. Various numerical applications are introduced in this article to illustrate our findings."
    },
    {
        title: "Probabilistic and Inferential Programming",
        authors: "Belhal Karimi",
        venue: "MS Thesis 2016",
        links: { pdf: "./assets/downloads/masters_thesis.pdf" },
        thumbnail: "/assets/paperthumb/masters2.png",
        abstract: "The following report is exploring all my areas of interests during my visit at the Probabilistic Computing Lab http://probcomp. csail. mit. edu at MIT, Brain and Cognitive Science Department. I would like to thank Vikash Mansighka for his supervision throughout the visit. He allowed me to tackle several issues towards the field and developed several skill sets I needed to pursue a career in Technological fields."
    }
];
