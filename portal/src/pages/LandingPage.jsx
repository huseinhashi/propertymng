import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Building2,  LineChart, Shield, ChevronRight, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate()
  const handleStaffLogin = () => {
    if (isAuthenticated ) {
      navigate(`/admin`);
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: Building2,
      title: "Post Repair Requests",
      description: "Easily submit repair requests with detailed descriptions and images.",
    },
    {
      icon: Settings,
      title: "Expert Repairs",
      description: "Connect with qualified repair experts for quality service.",
    },
    {
      icon: LineChart,
      title: "Real-time Tracking",
      description: "Monitor repair progress and updates in real-time.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Make and receive payments securely through our platform.",
    },
  ];

  const steps = [
    {
      title: "For Clients",
      steps: ["Register account", "Submit repair request", "Track progress", "Make payment"],
    },
    {
      title: "For Experts",
      steps: ["Join platform", "Accept jobs", "Complete repairs", "Receive payment"],
    },
    {
      title: "For Admins",
      steps: ["Monitor activity", "Manage users", "Handle disputes", "Process payments"],
    },
  ];

  const testimonials = [
    {
      quote: "This platform has made property maintenance so much easier!",
      author: "Eng Mohamed",
      role: "Property Owner",
    },
    {
      quote: "I've increased my business significantly through this platform.",
      author: "Abdulahi Ali",
      role: "Repair Expert",
    },
    {
      quote: "The best solution for property management I've used.",
      author: "Farah Mohamud",
      role: "Property Manager",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">PropertyCare Pro</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm hover:text-primary">Features</a>
              <a href="#how-it-works" className="text-sm hover:text-primary">How It Works</a>
              <a href="#testimonials" className="text-sm hover:text-primary">Testimonials</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
        
            <Button 
              onClick={handleStaffLogin}
            >
              {isAuthenticated 
                ? "Go to Dashboard" 
                : "Login"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Streamline Your Property Maintenance with Ease
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect with trusted repair experts and manage your property effortlessly
            </p>
        
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Property Management System?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((category, index) => (
              <div key={index} className="p-6 rounded-xl bg-white border">
                <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
                <div className="space-y-4">
                  {category.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card"
              >
                <p className="text-lg mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied users managing their properties efficiently
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Sign Up Now <ChevronRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">PropertyCare Pro</h3>
              <p className="text-slate-400">
                Making property maintenance simple and efficient.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
              <p className="text-slate-400 mb-4">
                Subscribe to our newsletter for updates
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3 py-2 rounded-md bg-slate-800 text-white flex-1"
                />
                <Button variant="secondary">Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2024 PropertyCare Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 