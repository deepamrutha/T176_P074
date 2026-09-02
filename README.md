\# T176\_P074 - Azure Sensitive Workload Architecture



\## Architecture Description



This architecture represents the flow of a sensitive workload in Microsoft Azure and compares standard compute with specialized compute options.



The process starts with the \*\*User/Client\*\*, who sends a request through a \*\*Browser or Postman\*\*. The request can be handled by two different compute options.



\### Standard VM



A \*\*Standard VM\*\* provides standard isolation and is suitable for general-purpose workloads. It is also a more cost-effective option.



\### Specialized Compute



\*\*Specialized Compute\*\* includes options such as \*\*Confidential VM\*\* or \*\*Dedicated Host\*\*. These provide stronger isolation and hardware-based security, making them more suitable for workloads that handle sensitive or confidential information.



\### Sensitive Workload and Application/API



The selected compute environment runs the \*\*Sensitive Workload\*\*, which is responsible for processing confidential data. This workload then communicates with the \*\*Application/API layer\*\*, where the main business logic, data processing, and API services are performed.



\### Security and Monitoring



To improve security, \*\*Secure Secrets/Key Vault\*\* can be used to safely store and manage important information such as passwords, encryption keys, and certificates.



\*\*Monitoring and Logs\*\* can also be used to monitor system performance, collect logs, and track important events.



\## Overall Architecture



Overall, this architecture helps us evaluate and compare standard and specialized Azure compute options based on factors such as:



\- Security

\- Isolation

\- Compliance

\- Performance

\- Availability

\- Cost



This comparison helps us select the most suitable Azure compute option for a sensitive workload.



\## Architecture Diagram



!\[Azure Sensitive Workload Architecture](architecture\_T176\_P074.jpg)

