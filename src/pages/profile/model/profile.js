export const emptyProfile = {
  fullName: "", headline: "", location: "", birthDate: "", gender: "", summary: "",
  readyStatus: "looking", expectedSalaryMin: null, expectedSalaryMax: null,
  desiredPosition: "", workType: "", desiredLocation: "",
  experiences: [], skills: [], education: [], certificates: [], projects: [],
};
export const demoProfile = {
  ...emptyProfile,
  fullName: "Nguyễn Hoàng Nam", headline: "Senior DevOps / Cloud Platform Engineer",
  location: "Cầu Giấy, Hà Nội", birthDate: "1995-05-19", gender: "Nam",
  summary: "Kỹ sư DevOps & Cloud Platform với hơn 5 năm kinh nghiệm thực chiến trong việc thiết kế, vận hành kiến trúc đám mây AWS quy mô lớn, triển khai các cụm Kubernetes (EKS/K8s on-premise) có độ sẵn sàng cao và tự động hóa toàn diện đường ống CI/CD. Tôi đam mê áp dụng Infrastructure as Code (Terraform), GitOps (ArgoCD) để chuẩn hóa hạ tầng, giảm thiểu thời gian triển khai ứng dụng và tối ưu hóa chi phí vận hành đám mây cho doanh nghiệp công nghệ hàng đầu.",
  expectedSalaryMin: 40000000, expectedSalaryMax: 55000000, desiredPosition: "Senior / Trưởng nhóm kỹ thuật",
  workType: "Hybrid (1–2d Remote)", desiredLocation: "Hà Nội / Làm việc từ xa",
  experiences: [
    { title: "Senior DevOps Engineer", organization: "FPT Software • Toàn thời gian", period: "03/2022 – Hiện tại (2 năm 5 tháng)", description: "Thiết kế và quản trị hệ thống cụm Kubernetes (AWS EKS) phục vụ cho hơn 40 microservices của khách hàng Fintech toàn cầu.\nỨng dụng giải pháp Infrastructure as Code (IaC) toàn diện bằng Terraform, tự động hóa quy trình phân bổ hạ tầng trên Dev/Staging/Prod.\nTriển khai đường ống GitOps bằng ArgoCD và Helm chart, rút ngắn thời gian release phiên bản từ 45 phút xuống dưới 6 phút.\nThanh tra xuất sắc: Tối ưu hóa dung lượng cụm và chuyển đổi Spot Instances giúp giảm 35% chi phí hạ tầng AWS hàng tháng (tiết kiệm ~12,000 USD/tháng).", tags: "Kubernetes, AWS EKS, Terraform, ArgoCD, Helm, Prometheus" },
    { title: "Cloud Infrastructure Engineer", organization: "VNG Corporation • Toàn thời gian", period: "06/2019 – 02/2022 (2 năm 9 tháng)", description: "Vận hành và giám sát hệ sinh thái ứng dụng trực tuyến với hơn 3 triệu người dùng hoạt động mỗi ngày trên nền tảng Private & Public Cloud.\nĐóng gói container hóa ứng dụng Monolith sang Microservices sử dụng Docker và Kubernetes nội bộ.\nXây dựng hệ thống giám sát tập trung toàn diện với Prometheus, Grafana và cảnh báo Alertmanager qua Slack & PagerDuty.", tags: "Docker, Jenkins CI/CD, Prometheus/Grafana, Linux / Bash, Python" },
  ],
  skills: ["Quản lý dự án Agile/Scrum", "Làm việc nhóm & Đào tạo kỹ thuật (Mentoring)", "Tư duy giải quyết vấn đề hệ thống (Troubleshooting)"].map(title => ({ title, organization: "", period: "", description: "", tags: "" })),
  education: [{ title: "Trường Đại học Bách Khoa Hà Nội", organization: "Kỹ sư Công nghệ Thông tin (Khoa CNTT & Truyền thông)", period: "2014 – 2019", description: "Tốt nghiệp loại Giỏi    GPA: 3.4 / 4.0", tags: "" }],
  certificates: [
    { title: "AWS Certified Solutions Architect – Professional", organization: "Amazon Web Services", period: "11/2023 – 11/2026", description: "ID: AWS-PSA-8829184", tags: "" },
    { title: "Certified Kubernetes Administrator (CKA)", organization: "Cloud Native Computing Foundation (CNCF)", period: "05/2023 – 05/2026", description: "ID: CKA-2300-847291", tags: "" },
    { title: "HashiCorp Certified: Terraform Associate", organization: "HashiCorp", period: "08/2022 – 08/2024", description: "ID: HASHI-TA-99120", tags: "" },
  ],
  projects: [{ title: "Automated Multi-Cluster Kubernetes Deployment Platform", organization: "Vai trò: Lead Cloud Architect & Developer", period: "", description: "Dự án tự động hóa triển khai và quản lý hạ tầng đám mây cho hơn 50 microservices đa vùng (Multi-region EKS) trên AWS. Tích hợp sẵn ArgoCD GitOps, Vault cho bảo mật Secret, giải pháp giám sát VictoriaMetrics kết hợp Grafana Dashboard tự động sinh cấu hình.", tags: "Kubernetes 1.28, Terraform, ArgoCD, HashiCorp Vault, Golang, AWS EKS" }],
};
