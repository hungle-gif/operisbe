/**
 * Default team structure for proposals
 * Mix of real staff (Sale, Dev, Admin) and virtual specialists
 */

export interface DefaultTeamMember {
  name: string
  role: string
  rating: number
  age: number
  experience_years: number
  isReal: boolean
  description?: string
}

export const DEFAULT_TEAM_MEMBERS: DefaultTeamMember[] = [
  // Real staff - Sale (Customer Care)
  {
    name: "Nguyễn Minh Tuấn",
    role: "Chăm sóc khách hàng & Tư vấn",
    rating: 5,
    age: 32,
    experience_years: 7,
    isReal: true,
    description: "Chuyên viên tư vấn và chăm sóc khách hàng"
  },

  // Real staff - Lead Developer
  {
    name: "Trần Văn Hùng",
    role: "Trưởng nhóm phát triển",
    rating: 5,
    age: 35,
    experience_years: 10,
    isReal: true,
    description: "Lập trình viên chính, quản lý kỹ thuật"
  },

  // Real staff - Admin/Project Supervisor
  {
    name: "Phạm Thị Mai Anh",
    role: "Giám sát dự án",
    rating: 5,
    age: 38,
    experience_years: 12,
    isReal: true,
    description: "Quản lý tiến độ và chất lượng dự án"
  },

  // Virtual staff - UI/UX Designer
  {
    name: "Lê Hoàng Minh",
    role: "Thiết kế giao diện UI/UX",
    rating: 4,
    age: 28,
    experience_years: 5,
    isReal: false,
    description: "Chuyên gia thiết kế trải nghiệm người dùng"
  },

  // Virtual staff - Security Specialist
  {
    name: "Đỗ Quang Hải",
    role: "Chuyên gia bảo mật",
    rating: 5,
    age: 33,
    experience_years: 8,
    isReal: false,
    description: "Đảm bảo an toàn và bảo mật hệ thống"
  },

  // Virtual staff - QA/Tester
  {
    name: "Vũ Thị Thanh Hương",
    role: "Kiểm thử hệ thống (QA)",
    rating: 4,
    age: 27,
    experience_years: 4,
    isReal: false,
    description: "Kiểm tra chất lượng và tìm lỗi hệ thống"
  }
]

/**
 * Get team members for proposal (simplified format)
 */
export function getProposalTeamMembers() {
  return DEFAULT_TEAM_MEMBERS.map(member => ({
    name: member.name,
    role: member.role,
    rating: member.rating
  }))
}

/**
 * Get team members for service display (full info)
 */
export function getServiceTeamMembers() {
  return DEFAULT_TEAM_MEMBERS.map(member => ({
    name: member.name,
    role: member.role,
    rating: member.rating,
    avatar: `/avatars/default-${member.name.split(' ')[0].toLowerCase()}.png`,
    experience: `${member.experience_years} năm kinh nghiệm`,
    description: member.description || `Chuyên gia ${member.role.toLowerCase()}`
  }))
}
